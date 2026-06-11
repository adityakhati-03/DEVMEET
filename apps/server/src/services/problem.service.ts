import Problem from '../models/Problem';
import type { IProblem, ProblemDifficulty } from '@devmeet/shared';

export const problemService = {
  async getProblems(filters: { difficulty?: ProblemDifficulty; tag?: string; search?: string }) {
    const query: any = { isPublic: true };
    
    if (filters.difficulty) {
      query.difficulty = filters.difficulty;
    }
    
    if (filters.tag) {
      query.tags = { $in: [filters.tag] };
    }
    
    if (filters.search) {
      query.title = { $regex: filters.search, $options: 'i' };
    }

    // Exclude testCases array from list to keep payload small
    return Problem.find(query).select('-testCases -starterCode -driverCode').sort({ createdAt: -1 });
  },

  async getProblemById(problemId: string) {
    const problem = await Problem.findById(problemId);
    if (!problem) return null;
    
    // We must omit the hidden test case outputs for the frontend!
    // But since Mongoose returns documents, we'll map them in the controller.
    return problem;
  }
};
