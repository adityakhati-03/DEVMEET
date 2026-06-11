import 'dotenv/config';

const required = ['MONGODB_URI', 'REDIS_URL'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`[Worker] Missing required environment variable: ${key}`);
  }
}

const provider = (process.env.EXECUTION_PROVIDER ?? 'docker').toLowerCase();
if (provider !== 'docker') {
  throw new Error(`[Worker] Invalid EXECUTION_PROVIDER "${provider}". Must be "docker".`);
}

export const env = {
  mongodbUri: process.env.MONGODB_URI!,
  redisUrl: process.env.REDIS_URL!,
  nodeEnv: process.env.NODE_ENV ?? 'development',

  // Execution provider — default is docker
  executionProvider: 'docker' as const,

  // Sandbox limits
  executionTimeoutMs: parseInt(process.env.EXECUTION_TIMEOUT_MS ?? '5000', 10),
  executionMemoryMb: parseInt(process.env.EXECUTION_MEMORY_MB ?? '128', 10),
  executionCpuLimit: parseFloat(process.env.EXECUTION_CPU_LIMIT ?? '0.5'),
  maxCodeSizeKb: parseInt(process.env.EXECUTION_MAX_CODE_SIZE_KB ?? '64', 10),
  maxStdinSizeKb: parseInt(process.env.EXECUTION_MAX_STDIN_SIZE_KB ?? '16', 10),
  maxOutputSizeKb: parseInt(process.env.EXECUTION_MAX_OUTPUT_SIZE_KB ?? '64', 10),
} as const;
