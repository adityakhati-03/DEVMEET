# Migration Phase 13: Global AI Problem Builder

## Goal
Implement a Global AI Problem Builder feature that allows users to create structure problems using AI inside of Collaboration, Practice, Normal Interview, and AI Interview modes. 

## Features
- **Four Generation Methods**:
  1. **Topic**: e.g., "Dynamic Programming"
  2. **Natural Prompt**: Plain English description
  3. **Pasted Statement**: Structuring unstructured text
  4. **LeetCode Inspired**: Creating original problems based on LeetCode URLs/Titles (without scraping)
- **Problem AI Model & Schema**: Expanded `Problem` schema to include `solution` and `sourceMetadata`.
- **Global Integration**: The button is integrated into all four modes of DevMeet.
- **Preview & Authorization**: Preview problems before saving. Enforces authorization checks before generating, saving, or attaching problems.

## Architecture Highlights
- `AIProblemGeneration` Model tracks generation attempts and inputs.
- `aiProblemService.ts` interacts with the `AIProvider` to format problems securely into JSON.
- Rate limiting implemented (`10/hr` for generation, `30/hr` for saving).
- Fully strict TypeScript types across `shared`, `server`, and `client`.

## Next Steps
- Implement AI Hints or Code Review in AI Interview mode.
- Add history of previously generated problems in the UI.
