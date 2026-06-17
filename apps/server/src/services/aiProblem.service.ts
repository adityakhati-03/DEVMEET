import Room from '../models/Room';
import Problem from '../models/Problem';
import AIProblemGeneration from '../models/AIProblemGeneration';
import { getAIProvider } from './ai/aiProvider';
import {
  buildProblemFromTopicPrompt,
  buildProblemFromNaturalPrompt,
  buildProblemFromPastedStatementPrompt,
  buildLeetCodeStyleProblemPrompt
} from './ai/aiPrompts';
import { parseAIProblemJSON } from '../utils/aiJsonParser';
import {
  canGenerateAIProblem,
  canSaveAIProblem,
  canAttachProblemToRoom,
  canViewProblemHiddenData
} from '../utils/aiProblemAuth';
import type { JwtPayload } from '../utils/jwt';
import { invalidateRoomCache } from '../controllers/room.controller';
import type {
  AIProblemBuilderRequest,
  SaveAIProblemRequest,
  AttachProblemToRoomRequest,
  GenerateAndAttachAIProblemRequest
} from '@devmeet/shared';
import slugify from 'slugify';

export class AIProblemService {
  async generate(user: JwtPayload, payload: AIProblemBuilderRequest, roomIdForAuth?: string) {
    const room = roomIdForAuth ? await Room.findOne({ roomId: roomIdForAuth }) : null;

    if (!canGenerateAIProblem(user, room as any)) {
      throw Object.assign(new Error('You are not authorized to generate problems in this context'), { code: 'FORBIDDEN' });
    }

    let prompt = '';
    const langs = payload.languagePreferences || ['javascript', 'python', 'cpp'];
    
    switch (payload.method) {
      case 'topic':
        if (!payload.topic || !payload.difficulty) throw new Error('Topic and difficulty required');
        prompt = buildProblemFromTopicPrompt(payload.topic, payload.difficulty, payload.tags || [], langs);
        break;
      case 'prompt':
        if (!payload.prompt || !payload.difficulty) throw new Error('Prompt and difficulty required');
        prompt = buildProblemFromNaturalPrompt(payload.prompt, payload.difficulty, langs);
        break;
      case 'pasted_statement':
        if (!payload.pastedStatement) throw new Error('Pasted statement required');
        prompt = buildProblemFromPastedStatementPrompt(payload.pastedStatement, langs);
        break;
      case 'leetcode_style':
        if (!payload.leetcodeQuery) throw new Error('LeetCode query (URL, title, or number) required');
        prompt = buildLeetCodeStyleProblemPrompt(payload.leetcodeQuery, langs);
        break;
      default:
        throw new Error('Invalid generation method');
    }

    let aiResponse: string = '';
    let problem: any = null;
    let parseErrors: string[] = [];
    const provider = getAIProvider();
    const systemPrompt = 'You are an expert technical interview problem creator. Output ONLY valid JSON. No markdown, no comments, no extra text.';

    // Try up to 2 times — sometimes the AI outputs malformed JSON on first attempt
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        aiResponse = await provider.generateResponse({
          systemPrompt,
          messages: [{ role: 'user', content: prompt }],
          temperature: attempt === 0 ? 0.7 : 0.3, // Lower temperature on retry for more structured output
          maxTokens: 8192,
          responseFormat: 'json',
        });
      } catch (err: any) {
        console.error(`[AI Generation Error] Attempt ${attempt + 1}:`, err.message);
        if (attempt === 1) {
          await AIProblemGeneration.create({
            userId: user.id,
            roomId: roomIdForAuth || null,
            mode: payload.mode || null,
            interviewType: payload.interviewType || null,
            method: payload.method,
            input: payload,
            status: 'failed',
            errorMessage: err.message || 'AI provider error',
          });
          throw Object.assign(new Error(`AI provider failed to generate problem: ${err.message || 'Unknown error'}`), { code: 'AI_ERROR' });
        }
        continue;
      }

      const result = parseAIProblemJSON(aiResponse);
      problem = result.problem;
      parseErrors = result.errors;

      if (problem && parseErrors.length === 0) {
        break; // Success!
      }

      console.warn(`[AI Problem] Parse failed on attempt ${attempt + 1}: ${parseErrors.join(', ')}. ${attempt === 0 ? 'Retrying...' : 'Giving up.'}`);
    }

    if (!problem || parseErrors.length > 0) {
      await AIProblemGeneration.create({
        userId: user.id,
        roomId: roomIdForAuth || null,
        mode: payload.mode || null,
        interviewType: payload.interviewType || null,
        method: payload.method,
        input: payload,
        status: 'failed',
        errorMessage: `Failed to parse AI problem: ${parseErrors.join('; ')}`,
      });
      throw Object.assign(new Error(`AI returned malformed problem structure: ${parseErrors.join(', ')}`), { code: 'AI_PARSE_ERROR' });
    }

    // Set source metadata based on method
    let sourceMetadata: any = {};
    if (payload.method === 'pasted_statement') {
      sourceMetadata.generatedFrom = 'Pasted Statement';
    } else if (payload.method === 'leetcode_style') {
      sourceMetadata.originalQuery = payload.leetcodeQuery;
      sourceMetadata.disclaimer = 'Generated by AI inspired by LeetCode concepts. Not an exact clone.';
    } else if (payload.method === 'topic') {
      sourceMetadata.generatedFrom = `Topic: ${payload.topic}`;
    } else if (payload.method === 'prompt') {
      sourceMetadata.generatedFrom = `Prompt: ${payload.prompt?.substring(0, 50)}...`;
    }

    problem.sourceMetadata = sourceMetadata;

    const generation = await AIProblemGeneration.create({
      userId: user.id,
      roomId: roomIdForAuth || null,
      mode: payload.mode || null,
      interviewType: payload.interviewType || null,
      method: payload.method,
      input: payload,
      generatedProblem: problem,
      status: 'generated',
    });

    const hiddenTestCasesCount = problem.testCases.filter((tc: any) => tc.hidden).length;
    
    // Mask hidden test cases and solutions for preview based on auth
    // Note: Since this is PREVIEW, the person generating it is usually the owner and can see it,
    // but just to be safe, we mask hidden data unless they are explicitly authorized.
    // However, if they generated it, they own it. So they should see it for preview.
    // The strict check comes when fetching a saved problem for a room.
    
    return {
      generationId: (generation._id as any).toString(),
      problem: {
        title: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        examples: problem.examples,
        constraints: problem.constraints,
        tags: problem.tags,
        starterCode: problem.starterCode,
        driverCode: problem.driverCode,
        visibleTestCases: problem.testCases.filter((tc: any) => !tc.hidden),
        hiddenTestCasesCount,
        sourceMetadata,
      }
    };
  }

  async save(user: JwtPayload, payload: SaveAIProblemRequest) {
    const generation = await AIProblemGeneration.findById(payload.generationId);
    if (!generation) {
      throw Object.assign(new Error('Generation record not found'), { code: 'NOT_FOUND' });
    }

    if (!canSaveAIProblem(user, generation)) {
      throw Object.assign(new Error('You are not authorized to save this generated problem'), { code: 'FORBIDDEN' });
    }

    if (generation.status === 'saved') {
      throw Object.assign(new Error('Problem already saved'), { code: 'ALREADY_SAVED' });
    }

    const problemData = generation.generatedProblem;
    let source = 'ai';
    if (generation.method === 'pasted_statement') source = 'pasted';
    if (generation.method === 'leetcode_style') source = 'leetcode_style';

    // Generate unique slug
    let baseSlug = slugify(problemData.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await Problem.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const problem = await Problem.create({
      title: problemData.title,
      slug,
      difficulty: problemData.difficulty,
      description: problemData.description,
      examples: problemData.examples,
      constraints: problemData.constraints,
      tags: problemData.tags,
      starterCode: problemData.starterCode,
      driverCode: problemData.driverCode,
      testCases: problemData.testCases.map((tc: any) => ({ ...tc, source: 'ai' })),
      solution: problemData.solution,
      sourceMetadata: problemData.sourceMetadata,
      source,
      createdBy: user.id,
      isPublic: payload.isPublic ?? false,
    });

    generation.status = 'saved';
    await generation.save();

    return { problemId: (problem._id as any).toString() };
  }

  async attachToRoom(user: JwtPayload, payload: AttachProblemToRoomRequest) {
    const room = await Room.findOne({ roomId: payload.roomId });
    if (!room) throw Object.assign(new Error('Room not found'), { code: 'NOT_FOUND' });

    if (!canAttachProblemToRoom(user, room as any)) {
      throw Object.assign(new Error('You are not authorized to attach problems to this room'), { code: 'FORBIDDEN' });
    }

    const problem = await Problem.findById(payload.problemId);
    if (!problem) throw Object.assign(new Error('Problem not found'), { code: 'NOT_FOUND' });

    // Enforce that AI Interview mode problem cannot be changed after session has started
    let session = null;
    if (room.mode === 'interview' && room.interviewSessionId) {
      const mongoose = require('mongoose');
      session = await mongoose.model('InterviewSession').findById(room.interviewSessionId);
      if (room.interviewType === 'ai' && session && session.status !== 'scheduled') {
        throw Object.assign(new Error('Cannot change problem after AI interview has started'), { code: 'FORBIDDEN' });
      }
    }

    room.problemId = problem._id;
    await room.save();
    await invalidateRoomCache(room);

    // Sync to session if one exists
    if (session) {
      session.problemId = problem._id;
      await session.save();
    }

    return { success: true };
  }

  async generateAndAttach(user: JwtPayload, payload: GenerateAndAttachAIProblemRequest) {
    // 1. Generate
    const { generationId, problem } = await this.generate(user, payload, payload.roomId);
    
    // 2. Save
    const { problemId } = await this.save(user, { generationId, isPublic: false });

    // 3. Attach
    await this.attachToRoom(user, { problemId, roomId: payload.roomId });

    return { problemId, generatedProblem: problem };
  }
}

export const aiProblemService = new AIProblemService();
