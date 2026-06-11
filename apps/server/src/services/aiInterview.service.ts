import InterviewSession from '../models/InterviewSession';
import AIInterviewMessage from '../models/AIInterviewMessage';
import AIInterviewReport from '../models/AIInterviewReport';
import Problem from '../models/Problem';
import type { CreateAIInterviewRequest, SendAIMessageRequest } from '@devmeet/shared';
import { getAIProvider } from './ai/aiProvider';
import { 
  SYSTEM_INTERVIEWER_PROMPT, 
  HINT_PROMPT_TEMPLATE, 
  CODE_REVIEW_PROMPT_TEMPLATE, 
  FINAL_EVALUATION_PROMPT_TEMPLATE,
  GENERATE_PROBLEM_PROMPT_TEMPLATE
} from './ai/aiPrompts';
import { buildProblemContext as contextBuilder, getChatHistory as historyBuilder } from './ai/aiContextBuilder';

export class AIInterviewService {
  async generateDynamicProblem(topic: string, difficulty: string, style: string, userId: string) {
    const provider = getAIProvider();
    const prompt = GENERATE_PROBLEM_PROMPT_TEMPLATE(topic, difficulty, style);

    const aiResponse = await provider.generateResponse({
      systemPrompt: "You are a strict JSON generator. Never output anything outside the JSON structure.",
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 8192,
      responseFormat: 'json'
    });

    let problemData;
    try {
      const cleaned = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      problemData = JSON.parse(cleaned);
    } catch (err) {
      console.error('Failed to parse AI generated problem JSON', err, aiResponse);
      throw new Error('Failed to generate problem data');
    }

    const slug = problemData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

    const newProblem = await Problem.create({
      title: problemData.title || 'Dynamic Problem',
      slug,
      difficulty: ['easy', 'medium', 'hard'].includes(problemData.difficulty?.toLowerCase()) ? problemData.difficulty.toLowerCase() : 'medium',
      description: problemData.description || 'No description provided.',
      examples: problemData.examples || [],
      constraints: problemData.constraints || [],
      starterCode: {
        javascript: problemData.starterCode?.javascript || '// Write your code here\n',
        cpp: '',
        python: ''
      },
      driverCode: { javascript: '', cpp: '', python: '' },
      testCases: [],
      createdBy: userId,
      source: 'ai',
      isPublic: false
    });

    return newProblem;
  }

  async startSession(sessionId: string, userId: string) {
    const session = await InterviewSession.findById(sessionId);
    if (!session || session.candidateId !== userId) throw new Error('Session not found or unauthorized');

    session.status = 'active';
    session.startedAt = new Date();
    
    // Add expiresAt based on durationMinutes
    if (session.durationMinutes) {
      session.expiresAt = new Date(Date.now() + session.durationMinutes * 60000);
    }
    
    // Create initial AI greeting
    const problem = await Problem.findById(session.problemId);
    if (!problem) throw new Error('Problem not found');

    const provider = getAIProvider();
    
    const problemContext = await contextBuilder(problem as any);
    
    const initialPrompt = `
      You are starting a technical interview. The candidate is ready. 
      Introduce yourself briefly and ask the candidate how they would approach solving the following problem:
      Title: ${problem.title}
      Description: ${problem.description}
    `;

    const aiResponse = await provider.generateResponse({
      systemPrompt: SYSTEM_INTERVIEWER_PROMPT,
      messages: [{ role: 'system', content: initialPrompt }]
    });

    const aiMessage = await AIInterviewMessage.create({
      sessionId,
      roomId: session.roomId,
      userId: 'ai',
      role: 'ai',
      type: 'message',
      content: aiResponse,
    });

    session.aiState = {
      stage: 'problem_understanding',
      hintsUsed: 0,
      lastFeedbackAt: null,
      score: null
    };

    await session.save();

    return { session, message: aiMessage };
  }

  async sendMessage(sessionId: string, userId: string, content: string) {
    const session = await InterviewSession.findById(sessionId);
    if (!session || session.status !== 'active') throw new Error('Session is not active');

    const userMessage = await AIInterviewMessage.create({
      sessionId,
      roomId: session.roomId,
      userId,
      role: 'candidate',
      type: 'message',
      content,
    });

    const problem = await Problem.findById(session.problemId);
    const problemContext = await contextBuilder(problem as any);
    const history = await historyBuilder(sessionId);

    const provider = getAIProvider();
    const aiResponse = await provider.generateResponse({
      systemPrompt: SYSTEM_INTERVIEWER_PROMPT + '\n\n' + problemContext,
      messages: history
    });

    const aiMessage = await AIInterviewMessage.create({
      sessionId,
      roomId: session.roomId,
      userId: 'ai',
      role: 'ai',
      type: 'message',
      content: aiResponse,
    });

    return { userMessage, aiMessage };
  }

  async requestHint(sessionId: string, userId: string, currentCode: string) {
    const session = await InterviewSession.findById(sessionId);
    if (!session || session.status !== 'active') throw new Error('Session is not active');

    const maxHints = session.aiConfig?.maxHints || 3;
    const hintsUsed = session.aiState?.hintsUsed || 0;

    if (hintsUsed >= maxHints) {
      throw new Error('Hint limit reached');
    }

    const problem = await Problem.findById(session.problemId);
    const problemContext = await contextBuilder(problem as any);

    const provider = getAIProvider();
    const hintPrompt = HINT_PROMPT_TEMPLATE(problemContext, currentCode, hintsUsed + 1);

    const aiResponse = await provider.generateResponse({
      systemPrompt: SYSTEM_INTERVIEWER_PROMPT,
      messages: [{ role: 'system', content: hintPrompt }]
    });

    const aiMessage = await AIInterviewMessage.create({
      sessionId,
      roomId: session.roomId,
      userId: 'ai',
      role: 'ai',
      type: 'hint',
      content: aiResponse,
    });

    session.aiState.hintsUsed = hintsUsed + 1;
    await session.save();

    return aiMessage;
  }

  async reviewCode(sessionId: string, userId: string, currentCode: string, executionResults?: string) {
    const session = await InterviewSession.findById(sessionId);
    if (!session || session.status !== 'active') throw new Error('Session is not active');

    const problem = await Problem.findById(session.problemId);
    const problemContext = await contextBuilder(problem as any);

    const provider = getAIProvider();
    const reviewPrompt = CODE_REVIEW_PROMPT_TEMPLATE(problemContext, currentCode, executionResults || 'None');

    const aiResponse = await provider.generateResponse({
      systemPrompt: SYSTEM_INTERVIEWER_PROMPT,
      messages: [{ role: 'system', content: reviewPrompt }]
    });

    const aiMessage = await AIInterviewMessage.create({
      sessionId,
      roomId: session.roomId,
      userId: 'ai',
      role: 'ai',
      type: 'feedback',
      content: aiResponse,
    });

    return aiMessage;
  }

  async generateReport(sessionId: string, finalCode: string, executionSummary: string) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error('Session not found');

    const problem = await Problem.findById(session.problemId);
    const problemContext = await contextBuilder(problem as any);

    const provider = getAIProvider();
    const evalPrompt = FINAL_EVALUATION_PROMPT_TEMPLATE(problemContext, finalCode, executionSummary);

    const aiResponse = await provider.generateResponse({
      systemPrompt: "You are a JSON generator. Do not output anything outside the JSON block.",
      messages: [{ role: 'user', content: evalPrompt }],
      temperature: 0.1, // Low temp for structured JSON
      responseFormat: 'json'
    });

    let reportData;
    try {
      // Strip markdown code blocks if AI wrapped the JSON
      const cleaned = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      reportData = JSON.parse(cleaned);
    } catch (err) {
      console.error('Failed to parse AI report JSON', err, aiResponse);
      throw new Error('Failed to generate structured report');
    }

    const report = await AIInterviewReport.create({
      sessionId,
      roomId: session.roomId,
      candidateId: session.candidateId,
      problemId: session.problemId,
      finalCode,
      language: 'javascript', // TODO dynamically map
      correctnessScore: reportData.correctnessScore || 0,
      approachScore: reportData.approachScore || 0,
      complexityScore: reportData.complexityScore || 0,
      codeQualityScore: reportData.codeQualityScore || 0,
      communicationScore: reportData.communicationScore || 0,
      overallScore: reportData.overallScore || 0,
      strengths: reportData.strengths || [],
      weaknesses: reportData.weaknesses || [],
      suggestions: reportData.suggestions || [],
      timeComplexity: reportData.timeComplexity || 'Unknown',
      spaceComplexity: reportData.spaceComplexity || 'Unknown',
      aiSummary: reportData.summary || 'No summary provided',
    });

    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();

    return report;
  }
}

export const aiInterviewService = new AIInterviewService();
