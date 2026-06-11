# How to Run DevMeet

This guide provides detailed, step-by-step instructions on how to set up, run, and deploy DevMeet. Keep this file handy!

## Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js**: v18+ (v20+ recommended)
- **MongoDB**: A running local instance or a cloud MongoDB Atlas URI.
- **Redis**: A running local instance or a cloud Redis URI.
- **Docker**: Must be installed and running (Docker Desktop on Windows/Mac) to run the code execution sandboxes.

You will also need API keys from:
- **Stream**: For video conferencing (GetStream.io)
- **Resend**: For sending OTP emails (Resend.com)
- **Google Gemini**: For AI Problem Generation & AI Mock Interviews (Google AI Studio)

---

## 🔥 End-to-End Complete Checklist

To make DevMeet fully functional on your machine, you must complete these 5 steps:

1. **[ ] Install Docker Desktop:** Download from docker.com, install it, and ensure it is running in the background. The code execution worker *will fail* if Docker is not running.
2. **[ ] Get a Stream API Key:** Go to [getstream.io/video](https://getstream.io/video/), create a free account, create a new App, and copy the `Key` and `Secret`.
3. **[ ] Get a Resend API Key:** Go to [resend.com](https://resend.com), create a free account, add an API key, and copy it.
4. **[ ] Get a Gemini API Key:** Go to [Google AI Studio](https://aistudio.google.com/app/apikey), click "Create API Key", and copy it. This powers the AI Mock Interview and AI Problem Builder features.
5. **[ ] Set up MongoDB & Redis:** Either install them locally or use free cloud tiers (MongoDB Atlas & Upstash Redis).

Once you have these, populate your `.env` files as shown below.

---

## 1. Initial Setup

1. **Install Dependencies**
   Run the following command at the root of the project to install all dependencies for the workspace:
   ```bash
   npm install
   ```

2. **Setup Environment Variables**
   You need to configure environment variables for the Server, Worker, and Client.

   **Server (`apps/server/.env`)**
   Create a `.env` file in `apps/server/`:
   ```env
   NODE_ENV=development
   PORT=5000
   CLIENT_URL=http://localhost:5173
   
   # Database & Cache
   MONGODB_URI=mongodb://localhost:27017/devmeet
   REDIS_URL=redis://localhost:6379
   
   # Security
   JWT_SECRET=your_super_secret_jwt_key_here
   BCRYPT_SALT_ROUNDS=12
   
   # Email Verification (Resend)
   RESEND_API_KEY=re_your_resend_api_key
   EMAIL_FROM=onboarding@resend.dev
   
   # Video Conferencing (Stream)
   STREAM_VIDEO_API_KEY=your_stream_api_key
   STREAM_VIDEO_API_SECRET=your_stream_api_secret

   # AI Integrations (Google Gemini)
   GEMINI_API_KEY=your_gemini_api_key
   ```

   **Worker (`apps/worker/.env`)**
   Create a `.env` file in `apps/worker/`:
   ```env
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/devmeet
   REDIS_URL=redis://localhost:6379
   ```

   **Client (`apps/client/.env`)**
   Create a `.env` file in `apps/client/` (Vite requires the `VITE_` prefix):
   ```env
   VITE_API_URL=http://localhost:5000
   ```

---

## 2. Running Locally (Development Mode)

To run DevMeet locally for development, you need to start the frontend, the backend server, and the code-execution worker.

1. **Start the Frontend & Backend Server**
   Open a terminal at the project root and run:
   ```bash
   npm run dev
   ```
   *This uses `concurrently` to start the Vite frontend on `localhost:5173` and the Express backend on `localhost:5000`.*

2. **Start the Code Execution Worker**
   Open a **second** terminal at the project root and run:
   ```bash
   npm run dev:worker
   ```
   *This starts the BullMQ worker that listens for code execution jobs. The worker will automatically pull the required Docker images (like `node:22-slim`, `python:3.12-slim`) the first time you run code in those languages.*

3. **Access the App**
   Open your browser and navigate to `http://localhost:5173`.

---

## 3. Running with Docker Compose (Production Mode)

If you want to run the entire stack (Client, Server, Worker, and Redis) in a production-like environment using Docker, follow these steps:

1. **Create a Root `.env` file**
   Create a `.env` file in the **root** of the project (`/DEVMEET/.env`). This is used by `docker-compose`.
   ```env
   MONGODB_URI=your_production_mongodb_uri
   JWT_SECRET=your_super_secret_jwt_key_here
   RESEND_API_KEY=re_your_resend_api_key
   EMAIL_FROM=onboarding@resend.dev
   STREAM_VIDEO_API_KEY=your_stream_api_key
   STREAM_VIDEO_API_SECRET=your_stream_api_secret
   ```

2. **Build and Start**
   Run the following command at the root of the project:
   ```bash
   docker-compose up --build -d
   ```
   
   This will:
   - Build the frontend and serve it using Nginx (Port 80).
   - Build the backend Express server (Port 5000).
   - Build the execution worker.
   - Start a Redis container for rate-limiting, job queuing, and WebSocket pub/sub.

3. **Important Note for Windows Users**
   The worker container mounts `/var/run/docker.sock` so it can spawn sandboxed code-execution containers on your host machine. Ensure Docker Desktop is running and allows mounting the docker socket.

4. **Access the App**
   Open your browser and navigate to `http://localhost`.

---

## 4. Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts Client and Server in dev mode |
| `npm run dev:worker` | Starts the Code Execution Worker |
| `npm run build` | Builds all packages (Shared, Client, Server, Worker) |
| `npm run lint` | Runs ESLint across all workspaces |
| `docker-compose logs -f` | Views real-time logs from all docker containers |
| `docker-compose down` | Stops and removes all containers |

## 5. Troubleshooting Code Execution
If code execution fails with an error about "Docker", ensure:
1. Docker Desktop is running.
2. The language images exist. You can manually pull them if needed:
   ```bash
   docker pull node:22-slim
   docker pull python:3.12-slim
   docker pull gcc:latest
   ```
