# DevMeet: Technical Architecture & Technology Stack Report

This document outlines the core technologies, frameworks, and architectural patterns utilized in the DevMeet project, along with a brief description of their specific role in the application.

## 1. Frontend Architecture (Client-Side)

*   **React.js (via Vite)**
    *   **Usage:** The core UI framework used to build the interactive, Single Page Application (SPA). Vite is used as the build tool to ensure extremely fast Hot Module Replacement (HMR) during development and optimized bundling for production.
*   **Monaco Editor**
    *   **Usage:** The code editor component embedded in the platform. It provides a VS-Code-like experience, including syntax highlighting, bracket matching, and code formatting for languages like JavaScript, Python, and C++.
*   **Yjs & WebSockets (y-websocket)**
    *   **Usage:** Implements real-time collaborative text editing. Yjs uses Conflict-free Replicated Data Types (CRDTs) to ensure that when multiple users type in the Monaco Editor simultaneously, their changes are merged seamlessly without conflicts.
*   **Stream Video SDK**
    *   **Usage:** Powers the real-time audio and video conferencing features within the interview rooms, utilizing WebRTC protocols to ensure low-latency communication between peers.
*   **Axios**
    *   **Usage:** Handles all HTTP requests from the frontend to the backend REST API, utilizing interceptors to attach secure credentials and standardize error handling.

## 2. Backend Architecture (Server-Side)

*   **Node.js & Express.js**
    *   **Usage:** The robust backend server environment and web framework. It serves as the orchestration layer, handling REST API routing, business logic, user authorization, and proxying requests to the AI models and the code execution worker.
*   **MongoDB & Mongoose**
    *   **Usage:** The primary NoSQL database. Mongoose is used as the Object Data Modeling (ODM) library to enforce strict schemas for structured data like Users, Rooms, Problems, Interview Sessions, and AI Reports.
*   **JSON Web Tokens (JWT) & httpOnly Cookies**
    *   **Usage:** Secures user authentication. JWTs are generated upon login and stored securely in the browser via `httpOnly` cookies to prevent Cross-Site Scripting (XSS) attacks.
*   **WebSocket Server (ws)**
    *   **Usage:** A dedicated WebSocket server running alongside the Express API that manages persistent, bi-directional connections for the collaborative Yjs document syncing and real-time room state updates.

## 3. Distributed Code Execution Engine (Worker)

*   **BullMQ**
    *   **Usage:** A robust, Redis-backed message queue system. When a user submits code, the backend pushes a "job" to BullMQ. The separate Worker process consumes these jobs asynchronously, ensuring the main backend never blocks or crashes during heavy code execution loads.
*   **Docker (via Dockerode)**
    *   **Usage:** Provides secure sandbox environments for remote code execution. The Worker process programmatically spins up isolated, ephemeral Linux containers to safely compile and run untrusted user code against hidden test cases, preventing malicious code from harming the host server.
*   **Redis**
    *   **Usage:** An in-memory data structure store used for two critical purposes: 1) Backing the BullMQ job queue for the code execution worker, and 2) Storing transient data for strict API Rate Limiting to prevent spam.

## 4. Generative AI Integration (Google Gemini)

*   **Google Generative AI SDK (Gemini)**
    *   **Usage:** The core Large Language Model (LLM) powering all intelligent features on the platform. We utilize advanced models (like Gemini 2.5) to interact with users programmatically.
*   **Dynamic Problem Generation (JSON Mode)**
    *   **Usage:** Uses the AI to dynamically generate fully functional coding problems. By enforcing strict JSON schemas via `application/json` MIME types, the AI outputs structured data including problem constraints, starter code, and test cases based on user prompts or LeetCode URLs.
*   **Autonomous AI Interviewer Agent**
    *   **Usage:** A conversational agent that acts as a technical interviewer. By passing the user's current code state and chat history into the LLM's context window, the AI can review code logic and provide progressive hints without giving away the direct answer.
*   **Automated Performance Evaluation Engine**
    *   **Usage:** A specialized prompt pipeline that feeds the candidate's final code, test case results, and interview chat transcript into the AI to generate a comprehensive, structured evaluation report, calculating metrics like Time/Space complexity and communication scores.

## 5. DevOps & Repository Management

*   **Monorepo Architecture (npm workspaces)**
    *   **Usage:** The entire project (Client, Server, Worker, and Shared Types) is housed in a single repository. This allows seamless sharing of TypeScript interfaces across the frontend and backend, ensuring end-to-end type safety and easier dependency management.
*   **TypeScript**
    *   **Usage:** A strict syntactical superset of JavaScript used across the entire stack to catch errors at compile-time, enforce interface contracts between microservices, and drastically improve code maintainability and developer experience.
