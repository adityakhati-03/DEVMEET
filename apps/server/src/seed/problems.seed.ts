import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { env } from '../config/env';
import Problem from '../models/Problem';

const sampleProblems = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'easy',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    tags: ['Array', 'Hash Table'],
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  // Write your code here\n}\n`,
      python: `def twoSum(nums, target):\n    # Write your code here\n    pass\n`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};`,
    },
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', hidden: false },
      { input: '[3,2,4]\n6', expectedOutput: '[1,2]', hidden: false },
      { input: '[3,3]\n6', expectedOutput: '[0,1]', hidden: false },
    ],
    source: 'manual',
    isPublic: true,
  },
  {
    title: 'Reverse String',
    slug: 'reverse-string',
    difficulty: 'easy',
    description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array in-place with \`O(1)\` extra memory.`,
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
      },
    ],
    constraints: [
      '1 <= s.length <= 10^5',
      's[i] is a printable ascii character.',
    ],
    tags: ['Two Pointers', 'String'],
    starterCode: {
      javascript: `function reverseString(s) {\n  // Write your code here\n}\n`,
      python: `def reverseString(s):\n    # Write your code here\n    pass\n`,
      cpp: `class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        // Write your code here\n    }\n};`,
    },
    testCases: [
      { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', hidden: false },
      { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', hidden: false },
    ],
    source: 'manual',
    isPublic: true,
  },
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'medium',
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.`,
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
      },
      {
        input: 'nums = [1]',
        output: '1',
        explanation: 'The subarray [1] has the largest sum 1.',
      },
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
    ],
    tags: ['Array', 'Divide and Conquer', 'Dynamic Programming'],
    starterCode: {
      javascript: `function maxSubArray(nums) {\n  // Write your code here\n}\n`,
      python: `def maxSubArray(nums):\n    # Write your code here\n    pass\n`,
      cpp: `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your code here\n    }\n};`,
    },
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', hidden: false },
      { input: '[1]', expectedOutput: '1', hidden: false },
      { input: '[5,4,-1,7,8]', expectedOutput: '23', hidden: false },
    ],
    source: 'manual',
    isPublic: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log('Connected to MongoDB');

    // Clear existing
    await Problem.deleteMany({ source: 'manual' });
    console.log('Cleared existing manual problems');

    await Problem.insertMany(sampleProblems);
    console.log('Successfully seeded problems');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding problems:', error);
    process.exit(1);
  }
}

seed();
