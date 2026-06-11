# Migration Phase 12: Global Generate Test Cases

## Overview

This migration adds a globally available AI-powered test case generation system to DevMeet. It works across all four room modes: Collaboration, Practice, Normal Interview, and AI Interview.

---

## What Changed

### Backend
| File | Action |
|------|--------|
| `models/TestCaseGeneration.ts` | NEW — Mongoose model for tracking AI generation sessions |
| `models/Problem.ts` | MODIFIED — Added `explanation`, `type`, `source` to testCases subdocument |
| `services/testCase.service.ts` | NEW — Core service for generation and saving |
| `controllers/testCase.controller.ts` | NEW — Express route handlers |
| `routes/testCase.routes.ts` | NEW — Routes with rate limiting |
| `app.ts` | MODIFIED — Mounted `/api/test-cases` |
| `services/ai/aiPrompts.ts` | MODIFIED — Added `buildGenerateTestCasesPrompt()` |
| `utils/aiJsonParser.ts` | NEW — Safe AI JSON parser/validator |
| `utils/testCaseAuth.ts` | NEW — Authorization helper functions |

### Frontend
| File | Action |
|------|--------|
| `services/testCaseService.ts` | NEW — HTTP service functions |
| `components/test-cases/TestCaseTypeBadge.tsx` | NEW — Color-coded type badge |
| `components/test-cases/GeneratedTestCaseList.tsx` | NEW — Expandable list with use/save actions |
| `components/test-cases/GenerateTestCasesModal.tsx` | NEW — Full modal with preferences and generated output |
| `components/test-cases/GenerateTestCasesButton.tsx` | NEW — Compact trigger button |
| `components/practice/ProblemPanel.tsx` | MODIFIED — Added button |
| `components/practice/PracticeLayout.tsx` | MODIFIED — Thread input callback |
| `components/interview/InterviewProblemPanel.tsx` | MODIFIED — Added button with isInterviewer |
| `components/interview/NormalInterviewLayout.tsx` | MODIFIED — Thread testInputOverride |
| `components/interview/InterviewEditor.tsx` | MODIFIED — Accept externalInput prop |
| `components/ai-interview/AIInterviewLayout.tsx` | MODIFIED — Added button in problem panel |
| `components/editor/CollaborativeEditor.tsx` | MODIFIED — Added button in toolbar |

### Shared Types
| File | Action |
|------|--------|
| `packages/shared/src/types/index.ts` | MODIFIED — Added `TestCaseType`, `TestCaseGenerationMode`, `GeneratedTestCase`, `GenerateTestCasesRequest`, `GenerateTestCasesResponse`, `SaveTestCasesRequest`. Extended `ProblemTestCase`. |

---

## Feature Overview

1. User clicks the **"Generate Test Cases"** button (visible in all 4 room modes)
2. A modal appears with preferences:
   - Problem context (auto-filled from room problem or manual textarea in Collaboration mode)
   - Count (3, 5, 8, 10, 15, 20)
   - "Include edge cases" toggle
   - "Include hidden test cases" checkbox (interviewers only, interview mode only)
3. Backend calls Google Gemini AI with a strict JSON-only prompt
4. AI returns structured test cases with type, explanation, hidden flag
5. Backend validates/sanitizes JSON using `aiJsonParser.ts`
6. Frontend displays expandable list with type badges (Basic, Edge, Corner, Large, Random)
7. User can "Use as Input" (injects into editor stdin) or "Save to Problem" (for authorized users)

---

## Supported Modes

| Mode | Button Location | Hidden Generation | Can Save |
|------|----------------|-------------------|----------|
| Collaboration | Editor toolbar | No | Room owner only |
| Practice | Problem panel (below constraints) | No | Problem owner only |
| Normal Interview | Problem panel | Yes (interviewer only) | Interviewer only |
| AI Interview | Problem panel (bottom bar) | No | Not available |

---

## API Routes Added

### `POST /api/test-cases/generate`
**Auth required. Rate limited: 10 req/hour/user.**

Request body: `GenerateTestCasesRequest`
Response: `{ generationId, testCases: GeneratedTestCase[], discarded: number }`

### `POST /api/test-cases/save`
**Auth required. Rate limited: 30 req/hour/user.**

Request body: `SaveTestCasesRequest`
Response: `{ saved: number }`

---

## AI Prompt Design

The prompt (`buildGenerateTestCasesPrompt`) instructs the AI to:
- Output raw JSON only (no markdown fences)
- Generate a mix of: basic, edge, corner, large, random test types
- Respect problem constraints
- Not generate oversized inputs/outputs (>5000 chars)
- Note assumptions in the `explanation` field
- Not duplicate provided examples

---

## JSON Response Format

```json
{
  "testCases": [
    {
      "input": "...",
      "expectedOutput": "...",
      "explanation": "...",
      "type": "edge",
      "hidden": false
    }
  ]
}
```

---

## Authorization Rules

| Who | Generate Visible | Generate Hidden | Save to Problem |
|-----|-----------------|-----------------|-----------------|
| Collaboration room participant | ✅ | ❌ | Room owner only |
| Practice room owner | ✅ | ❌ | ✅ own problems |
| Normal interview candidate | ✅ | ❌ | ❌ |
| Normal interview interviewer | ✅ | ✅ | ✅ |
| AI interview candidate | ✅ | ❌ | ❌ |

---

## Hidden Test Case Security

- Hidden expected outputs are **stripped** from API responses for candidates
- A candidate who receives a hidden test case will see `[hidden]` as the expected output
- The `canViewHiddenExpectedOutputs()` helper enforces this check
- Candidates cannot pass `includeHidden: true` — backend silently overrides to `false`
- Generated hidden test cases are stored in the `TestCaseGeneration` document and can only be read by interviewers

---

## Rate Limits

| Endpoint | Limit | Window | Redis Key Pattern |
|----------|-------|--------|-------------------|
| `/generate` | 10 | 1 hour | `rate_limit:ai:testcase:generate:user:{id}` |
| `/save` | 30 | 1 hour | `rate_limit:testcase:save:user:{id}` |

---

## JSON Validation Limits

| Field | Limit |
|-------|-------|
| Max generated test cases | 20 |
| Default count | 5 |
| Max input length | 5,000 chars |
| Max output length | 5,000 chars |
| Max explanation length | 500 chars |

---

## Known Limitations

1. AI-generated expected outputs are not verified by running them — they are best-effort from the LLM
2. The "Save to Problem" feature appends to `Problem.testCases` — it does not replace existing cases
3. In Collaboration Mode, if no problem is attached, the user must paste the description manually
4. Rate limiting is bypassed if Redis is down (fail-open behavior, same as rest of the system)

---

## Next Phase: Global AI Problem Fetch

Phase 13 will implement fetching problems from LeetCode and populating the DevMeet problem bank automatically, complete with test cases, examples, and constraints.
