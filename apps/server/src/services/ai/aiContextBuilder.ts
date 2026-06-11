import type { IProblem } from '@devmeet/shared';
import AIInterviewMessage from '../../models/AIInterviewMessage';

export async function buildProblemContext(problem: IProblem): Promise<string> {
  let context = `Title: ${problem.title}\nDifficulty: ${problem.difficulty}\n\nDescription:\n${problem.description}\n\nExamples:\n`;
  
  problem.examples.forEach((ex, idx) => {
    context += `Example ${idx + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}\n`;
    if (ex.explanation) context += `Explanation: ${ex.explanation}\n`;
  });

  context += `\nConstraints:\n${problem.constraints.join('\n')}\n`;
  return context;
}

export async function getChatHistory(sessionId: string, limit: number = 20): Promise<{role: 'user'|'assistant'|'system', content: string}[]> {
  const messages = await AIInterviewMessage.find({ sessionId })
    .sort({ createdAt: 1 })
    .limit(limit);

  return messages.map(msg => {
    let role: 'user' | 'assistant' | 'system' = 'system';
    if (msg.role === 'candidate') role = 'user';
    else if (msg.role === 'ai') role = 'assistant';
    
    return {
      role,
      content: msg.content
    };
  });
}
