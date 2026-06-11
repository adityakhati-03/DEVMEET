/**
 * Shared types for the Docker code execution sandbox.
 */

export type SandboxStatus =
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'compile_error'
  | 'runtime_error';

export interface SandboxResult {
  status: SandboxStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTimeMs: number;
  memoryLimitMb: number;
  timedOut: boolean;
  truncated: boolean;
}

export interface LanguageConfig {
  /** Docker image to use */
  image: string;
  /** Filename inside the container working dir */
  filename: string;
  /** Compile step — null for interpreted languages */
  compileCmd: string[] | null;
  /** Run command */
  runCmd: string[];
  /** Timeout for compilation step in ms (separate from run timeout) — 0 means no compile step */
  compileTimeoutMs: number;
  /** Wall-clock timeout for the run step in ms */
  timeoutMs: number;
  /** Memory limit for the container */
  memoryMb: number;
  /** CPU fraction for the container */
  cpuLimit: number;
}
