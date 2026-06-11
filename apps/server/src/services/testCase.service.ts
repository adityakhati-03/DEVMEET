import Room from '../models/Room';
import Problem from '../models/Problem';
import TestCaseGeneration from '../models/TestCaseGeneration';
import { getAIProvider } from './ai/aiProvider';
import { buildGenerateTestCasesPrompt } from './ai/aiPrompts';
import { parseAITestCasesJSON } from '../utils/aiJsonParser';
import {
  canGenerateTestCases,
  canGenerateHiddenTestCases,
  canSaveGeneratedTestCases,
  canViewHiddenExpectedOutputs,
} from '../utils/testCaseAuth';
import type { JwtPayload } from '../utils/jwt';
import type { GenerateTestCasesRequest, SaveTestCasesRequest, GeneratedTestCase } from '@devmeet/shared';

export class TestCaseService {
  async generate(user: JwtPayload, payload: GenerateTestCasesRequest) {
    // Load room and problem if given
    const room = payload.roomId ? await Room.findOne({ roomId: payload.roomId }) : null;
    const problem = payload.problemId ? await Problem.findById(payload.problemId) : null;

    // Authorization check
    if (room && !canGenerateTestCases(user, room as any)) {
      throw Object.assign(new Error('You are not authorized to generate test cases for this room'), { code: 'FORBIDDEN' });
    }

    // Hidden test case authorization
    const allowHidden = room ? canGenerateHiddenTestCases(user, room as any) : false;
    const requestedHidden = payload.includeHidden && allowHidden;

    if (payload.includeHidden && !allowHidden) {
      // Silently downgrade — candidates cannot generate hidden tests
      payload.includeHidden = false;
    }

    // Build prompt context
    const count = Math.min(payload.count || 5, 20);
    const promptContext = {
      problemTitle: payload.problemTitle || (problem?.title ?? undefined),
      problemDescription: payload.problemDescription,
      constraints: payload.constraints || (problem?.constraints ?? []),
      examples: payload.examples?.map((e: import('@devmeet/shared').ProblemExample) => ({ input: e.input, output: e.output, explanation: e.explanation }))
        || (problem?.examples?.map((e: any) => ({ input: e.input, output: e.output, explanation: e.explanation })) ?? []),
      existingTestCasesCount: payload.existingTestCases?.length || (problem?.testCases?.length ?? 0),
      language: payload.language,
      count,
      includeEdgeCases: payload.includeEdgeCases !== false,
      includeHidden: requestedHidden,
    };

    // Call AI
    let aiResponse: string;
    try {
      const provider = getAIProvider();
      const prompt = buildGenerateTestCasesPrompt(promptContext);
      aiResponse = await provider.generateResponse({
        systemPrompt: 'You are a strict JSON test case generator. Output only valid JSON, never markdown.',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        maxTokens: 3000,
      });
    } catch (err: any) {
      // Persist failed generation for audit
      await TestCaseGeneration.create({
        userId: user.id,
        roomId: payload.roomId,
        problemId: problem?._id ?? null,
        mode: payload.mode,
        interviewType: payload.interviewType ?? null,
        source: 'ai',
        inputContext: promptContext,
        generatedTestCases: [],
        status: 'failed',
        errorMessage: err.message || 'AI provider error',
      });
      throw Object.assign(new Error(err.message || 'AI provider failed to generate test cases'), { code: 'AI_ERROR' });
    }

    // Parse and validate
    const { testCases: parsed, discarded, errors } = parseAITestCasesJSON(aiResponse, count);

    if (parsed.length === 0) {
      await TestCaseGeneration.create({
        userId: user.id,
        roomId: payload.roomId,
        problemId: problem?._id ?? null,
        mode: payload.mode,
        interviewType: payload.interviewType ?? null,
        source: 'ai',
        inputContext: promptContext,
        generatedTestCases: [],
        status: 'failed',
        errorMessage: `No valid test cases parsed. Errors: ${errors.join('; ')}`,
      });
      throw Object.assign(new Error('AI returned no valid test cases. Please try again.'), { code: 'AI_PARSE_ERROR' });
    }

    // Sanitize hidden flag: if user cannot generate hidden cases, force hidden=false
    const sanitizedCases = parsed.map((tc) => ({
      ...tc,
      hidden: allowHidden ? tc.hidden : false,
    }));

    // Persist
    const generation = await TestCaseGeneration.create({
      userId: user.id,
      roomId: payload.roomId,
      problemId: problem?._id ?? null,
      mode: payload.mode,
      interviewType: payload.interviewType ?? null,
      source: 'ai',
      inputContext: promptContext,
      generatedTestCases: sanitizedCases,
      status: 'generated',
      errorMessage: null,
    });

    // Mask hidden expected outputs if user cannot see them
    const canSeeHidden = room ? canViewHiddenExpectedOutputs(user, room as any) : true;
    const responseCases: GeneratedTestCase[] = sanitizedCases.map((tc) => ({
      ...tc,
      expectedOutput: tc.hidden && !canSeeHidden ? '[hidden]' : tc.expectedOutput,
    }));

    return {
      generationId: (generation._id as any).toString(),
      testCases: responseCases,
      discarded,
    };
  }

  async save(user: JwtPayload, payload: SaveTestCasesRequest) {
    const generation = await TestCaseGeneration.findById(payload.generationId);
    if (!generation) {
      throw Object.assign(new Error('Generation record not found'), { code: 'NOT_FOUND' });
    }

    // Must be the same user
    if (generation.userId.toString() !== user.id) {
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }

    const problem = await Problem.findById(payload.problemId);
    if (!problem) {
      throw Object.assign(new Error('Problem not found'), { code: 'NOT_FOUND' });
    }

    // Load room for authorization
    const room = generation.roomId ? await Room.findOne({ roomId: generation.roomId }) : null;

    if (!canSaveGeneratedTestCases(user, room as any, problem as any)) {
      throw Object.assign(new Error('You are not authorized to save test cases to this problem'), { code: 'FORBIDDEN' });
    }

    const canHidden = room ? canViewHiddenExpectedOutputs(user, room as any) : true;

    // Sanitize and append test cases
    const casesToAdd = payload.testCases
      .filter((tc) => tc.input?.trim() && tc.expectedOutput?.trim())
      .map((tc) => ({
        input: tc.input.trim().slice(0, 5000),
        expectedOutput: tc.expectedOutput.trim().slice(0, 5000),
        hidden: canHidden ? (payload.saveAsHidden || tc.hidden) : false,
        explanation: tc.explanation?.slice(0, 500),
        type: tc.type || 'basic',
        source: 'ai' as const,
      }));

    if (casesToAdd.length === 0) {
      throw Object.assign(new Error('No valid test cases to save'), { code: 'BAD_REQUEST' });
    }

    problem.testCases.push(...(casesToAdd as any));
    await problem.save();

    generation.status = 'saved';
    await generation.save();

    return { saved: casesToAdd.length };
  }
}

export const testCaseService = new TestCaseService();
