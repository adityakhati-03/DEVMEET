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

/**
 * Safely parse and validate AI-generated problem JSON.
 */
export function parseAIProblemJSON(rawResponse: string): { problem: any; errors: string[] } {
  const errors: string[] = [];

  // Step 1: Strip markdown code fences
  let cleaned = rawResponse
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Step 2: Extract JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    return { problem: null, errors: ['No valid JSON object found in AI response'] };
  }
  cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  // Step 3: Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    return { problem: null, errors: [`JSON parse error: ${(err as Error).message}`] };
  }

  // Step 4: Validate required top-level fields
  if (!parsed.title || typeof parsed.title !== 'string') errors.push('Missing or invalid title');
  if (!parsed.difficulty || !['easy', 'medium', 'hard'].includes(parsed.difficulty)) errors.push('Missing or invalid difficulty');
  if (!parsed.description || typeof parsed.description !== 'string') errors.push('Missing or invalid description');

  if (errors.length > 0) {
    return { problem: null, errors };
  }

  // Step 5: Sanitize arrays and sizes
  const problem: any = {
    title: parsed.title.slice(0, 150).trim(),
    difficulty: parsed.difficulty,
    description: parsed.description.slice(0, 10000).trim(),
    examples: [],
    constraints: [],
    tags: [],
    starterCode: parsed.starterCode || {},
    driverCode: parsed.driverCode || {},
    testCases: [],
    solution: parsed.solution || {},
  };

  if (Array.isArray(parsed.examples)) {
    problem.examples = parsed.examples.slice(0, 5).map((ex: any) => ({
      input: typeof ex.input === 'string' ? ex.input.slice(0, 2000) : '',
      output: typeof ex.output === 'string' ? ex.output.slice(0, 2000) : '',
      explanation: typeof ex.explanation === 'string' ? ex.explanation.slice(0, 1000) : undefined,
    })).filter((ex: any) => ex.input && ex.output);
  }

  if (Array.isArray(parsed.constraints)) {
    problem.constraints = parsed.constraints
      .filter((c: any) => typeof c === 'string')
      .map((c: string) => c.slice(0, 200))
      .slice(0, 20);
  }

  if (Array.isArray(parsed.tags)) {
    problem.tags = parsed.tags
      .filter((t: any) => typeof t === 'string')
      .map((t: string) => t.slice(0, 50).trim())
      .slice(0, 10);
  }

  if (Array.isArray(parsed.testCases)) {
    problem.testCases = parsed.testCases.slice(0, 30).map((tc: any) => ({
      input: typeof tc.input === 'string' ? tc.input.slice(0, 5000) : '',
      expectedOutput: typeof tc.expectedOutput === 'string' ? tc.expectedOutput.slice(0, 5000) : '',
      hidden: typeof tc.hidden === 'boolean' ? tc.hidden : false,
      explanation: typeof tc.explanation === 'string' ? tc.explanation.slice(0, 500) : undefined,
      type: VALID_TYPES.includes(tc.type) ? tc.type : 'basic',
    })).filter((tc: any) => tc.input && tc.expectedOutput);
  }

  // Ensure starter and driver code properties are string and within limits
  ['cpp', 'python', 'javascript'].forEach(lang => {
    if (typeof problem.starterCode[lang] === 'string') {
      problem.starterCode[lang] = problem.starterCode[lang].slice(0, 10000);
    } else {
      delete problem.starterCode[lang];
    }

    if (typeof problem.driverCode[lang] === 'string') {
      problem.driverCode[lang] = problem.driverCode[lang].slice(0, 15000);
    } else {
      delete problem.driverCode[lang];
    }
  });

  return { problem, errors: [] };
}
