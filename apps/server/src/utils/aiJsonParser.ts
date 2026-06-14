import type { TestCaseType } from '@devmeet/shared';

const VALID_TYPES: TestCaseType[] = ['basic', 'edge', 'corner', 'large', 'random'];
const MAX_TEST_CASES = 20;
const MAX_INPUT_LENGTH = 5000;
const MAX_OUTPUT_LENGTH = 5000;

export interface ParsedTestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
  type: TestCaseType;
  hidden: boolean;
}

export interface ParseResult {
  testCases: ParsedTestCase[];
  discarded: number;
  errors: string[];
}

/**
 * Safely parse and validate AI-generated test case JSON.
 * Strips markdown fences, validates structure, enforces size limits.
 */
export function parseAITestCasesJSON(rawResponse: string, maxCount = MAX_TEST_CASES): ParseResult {
  const errors: string[] = [];
  let discarded = 0;

  // Step 1: Strip markdown code fences
  let cleaned = rawResponse
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Step 2: Extract JSON object (find first { to last })
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    return { testCases: [], discarded: 0, errors: ['No valid JSON object found in AI response'] };
  }
  cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  // Step 3: Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    return { testCases: [], discarded: 0, errors: [`JSON parse error: ${(err as Error).message}`] };
  }

  // Step 4: Validate top-level structure
  if (!parsed || !Array.isArray(parsed.testCases)) {
    return { testCases: [], discarded: 0, errors: ['AI response missing "testCases" array'] };
  }

  const rawCases: any[] = parsed.testCases;
  const validCases: ParsedTestCase[] = [];

  // Step 5: Validate each test case
  for (const tc of rawCases) {
    if (validCases.length >= maxCount) {
      discarded += rawCases.length - rawCases.indexOf(tc);
      break;
    }

    // Required field check
    if (typeof tc.input !== 'string' || typeof tc.expectedOutput !== 'string') {
      errors.push(`Discarding test case — missing input or expectedOutput`);
      discarded++;
      continue;
    }

    // Size limits
    if (tc.input.length > MAX_INPUT_LENGTH) {
      errors.push(`Discarding test case — input exceeds ${MAX_INPUT_LENGTH} chars`);
      discarded++;
      continue;
    }
    if (tc.expectedOutput.length > MAX_OUTPUT_LENGTH) {
      errors.push(`Discarding test case — expectedOutput exceeds ${MAX_OUTPUT_LENGTH} chars`);
      discarded++;
      continue;
    }

    // Empty check
    if (!tc.input.trim() || !tc.expectedOutput.trim()) {
      errors.push(`Discarding test case — empty input or expectedOutput`);
      discarded++;
      continue;
    }

    // Type normalization
    const type: TestCaseType = VALID_TYPES.includes(tc.type) ? tc.type : 'basic';

    validCases.push({
      input: tc.input.trim(),
      expectedOutput: tc.expectedOutput.trim(),
      explanation: typeof tc.explanation === 'string' ? tc.explanation.slice(0, 500) : undefined,
      type,
      hidden: typeof tc.hidden === 'boolean' ? tc.hidden : false,
    });
  }

  return { testCases: validCases, discarded, errors };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI PROBLEM JSON PARSER — Maximally flexible, multi-strategy approach
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Safely parse and validate AI-generated problem JSON.
 * Uses 3 strategies:
 *   1. Direct JSON parse with minimal cleaning
 *   2. Repaired JSON parse (trailing commas, unescaped chars, truncated output)
 *   3. Regex-based text extraction fallback
 */
export function parseAIProblemJSON(rawResponse: string): { problem: any; errors: string[] } {
  console.log(`[aiJsonParser] Raw response length: ${rawResponse.length} chars`);

  // ─── Strategy 1: Direct parse with minimal cleaning ──────────────────────
  let parsed = tryParseJSON(rawResponse);

  if (!parsed) {
    console.warn('[aiJsonParser] Strategy 1 (direct parse) failed, trying repairs...');
    // ─── Strategy 2: Repair common JSON issues and re-parse ────────────────
    parsed = tryParseJSON(repairJSON(rawResponse));
  }

  if (!parsed) {
    console.warn('[aiJsonParser] Strategy 2 (repaired parse) failed, trying text extraction...');
    // ─── Strategy 3: Extract fields from raw text using regex ──────────────
    parsed = extractFromText(rawResponse);
  }

  if (!parsed) {
    console.error('[aiJsonParser] All strategies failed. First 500 chars:', rawResponse.substring(0, 500));
    return { problem: null, errors: ['Could not extract problem data from AI response. Please try again.'] };
  }

  // ─── Build problem object flexibly from whatever we got ──────────────────
  const problem: any = {
    title: getString(parsed, ['title', 'name', 'problemTitle', 'problem_title']) || 'Untitled Problem',
    difficulty: normalizeDifficulty(getString(parsed, ['difficulty', 'level']) || 'medium'),
    description: getString(parsed, ['description', 'desc', 'problemDescription', 'statement', 'problem_description']) || 'No description provided.',
    examples: [],
    constraints: [],
    tags: [],
    starterCode: {},
    driverCode: {},
    testCases: [],
    solution: parsed.solution || {},
  };

  // Extract examples flexibly
  const rawExamples = getArray(parsed, ['examples', 'example', 'sampleCases', 'sample_cases']);
  problem.examples = rawExamples.slice(0, 5).map((ex: any) => ({
    input: String(ex.input ?? ex.Input ?? '').slice(0, 2000),
    output: String(ex.output ?? ex.Output ?? ex.expected ?? ex.expectedOutput ?? '').slice(0, 2000),
    explanation: typeof (ex.explanation ?? ex.Explanation) === 'string' ? (ex.explanation ?? ex.Explanation).slice(0, 1000) : undefined,
  })).filter((ex: any) => ex.input || ex.output);

  // Extract constraints
  const rawConstraints = getArray(parsed, ['constraints', 'constraint', 'limits']);
  problem.constraints = rawConstraints
    .map((c: any) => typeof c === 'string' ? c.slice(0, 200) : typeof c === 'object' ? JSON.stringify(c) : String(c))
    .slice(0, 20);

  // Extract tags
  const rawTags = getArray(parsed, ['tags', 'tag', 'topics', 'categories']);
  problem.tags = rawTags
    .map((t: any) => String(t).slice(0, 50).trim())
    .filter(Boolean)
    .slice(0, 10);

  // Extract starter code (handle both nested object and flat formats)
  const starterCode = parsed.starterCode || parsed.starter_code || parsed.boilerplate || {};
  if (typeof starterCode === 'object') {
    for (const [lang, val] of Object.entries(starterCode)) {
      if (typeof val !== 'string' || !val.trim()) continue;
      const normalized = lang === 'c++' ? 'cpp' : lang === 'js' ? 'javascript' : lang === 'py' ? 'python' : lang;
      problem.starterCode[normalized] = (val as string).slice(0, 10000);
    }
  }

  // Extract driver code
  const driverCode = parsed.driverCode || parsed.driver_code || parsed.mainCode || {};
  if (typeof driverCode === 'object') {
    for (const [lang, val] of Object.entries(driverCode)) {
      if (typeof val !== 'string') continue;
      const normalized = lang === 'c++' ? 'cpp' : lang === 'js' ? 'javascript' : lang === 'py' ? 'python' : lang;
      problem.driverCode[normalized] = (val as string).slice(0, 15000);
    }
  }

  // Extract test cases (accept many field name variations)
  const rawTestCases = getArray(parsed, ['testCases', 'test_cases', 'tests', 'testcases']);
  problem.testCases = rawTestCases.slice(0, 30).map((tc: any) => ({
    input: String(tc.input ?? tc.Input ?? '').slice(0, 5000),
    expectedOutput: String(tc.expectedOutput ?? tc.expected_output ?? tc.output ?? tc.Output ?? tc.expected ?? '').slice(0, 5000),
    hidden: tc.hidden === true || tc.isHidden === true,
    explanation: typeof tc.explanation === 'string' ? tc.explanation.slice(0, 500) : undefined,
    type: VALID_TYPES.includes(tc.type) ? tc.type : 'basic',
  })).filter((tc: any) => tc.input || tc.expectedOutput);

  // Source metadata
  problem.sourceMetadata = parsed.sourceMetadata || {};

  return { problem, errors: [] };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

/** Try to parse a string as JSON with minimal safe cleaning (no destructive regex) */
function tryParseJSON(raw: string): any | null {
  let cleaned = raw
    .replace(/^\uFEFF/, '')                    // BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, '')     // zero-width chars
    .replace(/```json\s*/gi, '')               // markdown code fence start
    .replace(/```\s*/g, '')                    // markdown code fence end
    .trim();

  // Find JSON object boundaries
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) return null;

  const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/** Attempt to repair common JSON issues without being destructive */
function repairJSON(raw: string): string {
  let cleaned = raw
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  let lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace === -1) return cleaned;
  if (lastBrace === -1) {
    // If there's no closing brace, the output was truncated.
    // Assume everything from the first brace to the end is the truncated JSON
    lastBrace = cleaned.length - 1;
  }

  let json = cleaned.slice(firstBrace, lastBrace + 1);

  // Fix 1: Remove trailing commas before ] or }
  json = json.replace(/,\s*([\]}])/g, '$1');

  // Fix 2: Escape unescaped newlines/tabs (using lookbehind to avoid double-escaping)
  json = json.replace(/(?<!\\)\n/g, '\\n');
  json = json.replace(/(?<!\\)\r/g, '\\r');
  json = json.replace(/(?<!\\)\t/g, '\\t');

  // Fix 3: Close unclosed brackets/braces (handles truncated output)
  let openBraces = 0, openBrackets = 0;
  let inStr = false, esc = false;
  for (const ch of json) {
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') openBraces++;
    if (ch === '}') openBraces--;
    if (ch === '[') openBrackets++;
    if (ch === ']') openBrackets--;
  }

  json = json.replace(/,\s*$/, '');
  for (let i = 0; i < openBrackets; i++) json += ']';
  for (let i = 0; i < openBraces; i++) json += '}';

  return json;
}

/** Last-resort: extract problem fields from raw text using regex */
function extractFromText(raw: string): any | null {
  // Extract roughly what looks like a title
  const titleMatch = raw.match(/["']?title["']?\s*[:=]\s*["']([^"']+)["']/i);
  
  // Extract everything after description up to "examples" or "constraints" or end
  const descMatch = raw.match(/["']?description["']?\s*[:=]\s*["']([\s\S]*?)(?:["']\s*,\s*["'](?:examples|constraints|tags|testCases|difficulty)|$)/i);
  
  const diffMatch = raw.match(/["']?difficulty["']?\s*[:=]\s*["']?(easy|medium|hard)["']?/i);

  if (!titleMatch && !descMatch) return null;

  console.log('[aiJsonParser] Using text extraction fallback');

  // Try to unescape the description if it's JSON-escaped
  let rawDesc = descMatch?.[1] || raw.substring(0, 2000);
  try {
    rawDesc = JSON.parse(`"${rawDesc}"`);
  } catch {
    // If it fails to parse (e.g. unescaped quotes), replace literal \n with newlines
    rawDesc = rawDesc.replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }

  return {
    title: titleMatch?.[1] || 'Extracted Problem',
    difficulty: diffMatch?.[1] || 'medium',
    description: rawDesc,
    examples: [],
    constraints: [],
    tags: [],
    starterCode: {},
    driverCode: {},
    testCases: [],
    solution: {},
  };
}

/** Get a string value from an object trying multiple key names */
function getString(obj: any, keys: string[]): string {
  for (const key of keys) {
    if (typeof obj[key] === 'string' && obj[key].trim()) {
      return obj[key].trim();
    }
  }
  return '';
}

/** Get an array value from an object trying multiple key names */
function getArray(obj: any, keys: string[]): any[] {
  for (const key of keys) {
    if (Array.isArray(obj[key])) {
      return obj[key];
    }
  }
  return [];
}

/** Normalize difficulty value to easy/medium/hard */
function normalizeDifficulty(val: string): string {
  const lower = val.toLowerCase().trim();
  if (['easy', 'simple', 'beginner'].includes(lower)) return 'easy';
  if (['hard', 'difficult', 'advanced', 'expert'].includes(lower)) return 'hard';
  return 'medium';
}
