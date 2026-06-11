/**
 * dockerExecutor — runs code inside a single persistent container via `docker exec`.
 *
 * Flow:
 *  1. Get or lazily create the persistent container for this language image.
 *  2. Write code + stdin files into the shared host volume (/sandbox).
 *  3. `docker exec` the compile step (if required).
 *  4. `docker exec` the run step with stdin piped in via `< stdin.txt`.
 *  5. Clean up code files from /sandbox after execution (container keeps running).
 */

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import type { SandboxResult, LanguageConfig } from './types';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { singleContainerManager } from './containerPool';

const MAX_OUTPUT_BYTES = env.maxOutputSizeKb * 1024;

// ─── Docker exec helper ────────────────────────────────────────────────────────

function execInContainer(
  containerId: string,
  shellCmd: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number | null; timedOut: boolean }> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const proc = spawn('docker', ['exec', containerId, 'sh', '-c', shellCmd], { shell: false });

    proc.stdout.on('data', (chunk: Buffer) => {
      const s = chunk.toString();
      if ((stdout + s).length <= MAX_OUTPUT_BYTES) stdout += s;
      else stdout = (stdout + s).substring(0, MAX_OUTPUT_BYTES);
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      const s = chunk.toString();
      if ((stderr + s).length <= MAX_OUTPUT_BYTES) stderr += s;
      else stderr = (stderr + s).substring(0, MAX_OUTPUT_BYTES);
    });

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, timeoutMs + 3_000);

    proc.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode, timedOut });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: err.message, exitCode: null, timedOut });
    });
  });
}

// ─── Main executor ─────────────────────────────────────────────────────────────

export async function runInDocker(
  config: LanguageConfig,
  code: string,
  stdin: string
): Promise<SandboxResult> {
  // Size guard
  const maxCodeBytes = env.maxCodeSizeKb * 1024;
  const maxStdinBytes = env.maxStdinSizeKb * 1024;

  if (Buffer.byteLength(code) > maxCodeBytes) {
    return { status: 'failed', stdout: '', stderr: `Code exceeds maximum size of ${env.maxCodeSizeKb}KB.`, exitCode: null, executionTimeMs: 0, memoryLimitMb: config.memoryMb, timedOut: false, truncated: false };
  }
  if (Buffer.byteLength(stdin) > maxStdinBytes) {
    return { status: 'failed', stdout: '', stderr: `stdin exceeds maximum size of ${env.maxStdinSizeKb}KB.`, exitCode: null, executionTimeMs: 0, memoryLimitMb: config.memoryMb, timedOut: false, truncated: false };
  }

  // Get or start the single persistent container for this image
  const container = await singleContainerManager.getOrCreate(config.image, config.memoryMb, config.cpuLimit);

  // Use a per-run subdirectory inside /sandbox to avoid file collisions between concurrent runs
  const runId = randomUUID();
  const runSubdir = `run-${runId}`;
  const hostRunDir = path.join(container.workDir, runSubdir);
  await fs.mkdir(hostRunDir, { recursive: true });

  const codeFile = path.join(hostRunDir, config.filename);
  const stdinFile = path.join(hostRunDir, 'stdin.txt');

  await fs.writeFile(codeFile, code, 'utf8');
  await fs.writeFile(stdinFile, stdin, 'utf8');

  const sandboxSubdir = `/sandbox/${runSubdir}`;
  const startTime = Date.now();

  try {
    // ── Step 1: Compile (if required) ──────────────────────────────────────────
    if (config.compileCmd) {
      const compileShell = `cd ${sandboxSubdir} && ${config.compileCmd.join(' ')}`;
      logger.info('[Docker] Compiling...', { container: container.id });

      // Use dedicated compile timeout (can be much longer than the run timeout)
      const compileTimeout = config.compileTimeoutMs > 0 ? config.compileTimeoutMs : config.timeoutMs;
      const compileResult = await execInContainer(container.id, compileShell, compileTimeout);

      if (compileResult.exitCode !== 0 || compileResult.timedOut) {
        const compileStderr = (compileResult.stderr || compileResult.stdout ||
          (compileResult.timedOut ? `Compilation timed out after ${compileTimeout / 1000}s.` : 'Compilation failed.')
        ).trim();
        return {
          status: 'compile_error',
          stdout: '',
          stderr: compileStderr,
          exitCode: compileResult.exitCode,
          executionTimeMs: Date.now() - startTime,
          memoryLimitMb: config.memoryMb,
          timedOut: compileResult.timedOut,
          truncated: false,
        };
      }
    }

    // ── Step 2: Run ────────────────────────────────────────────────────────────
    const timeoutSecs = Math.ceil(config.timeoutMs / 1000);
    const runShell = `cd ${sandboxSubdir} && timeout ${timeoutSecs} ${config.runCmd.join(' ')} < stdin.txt`;
    logger.info('[Docker] Running...', { container: container.id });

    const runResult = await execInContainer(container.id, runShell, config.timeoutMs + 3_000);

    const executionTimeMs = Date.now() - startTime;
    const timedOut = runResult.timedOut || runResult.exitCode === 124;
    const truncated = runResult.stdout.length >= MAX_OUTPUT_BYTES || runResult.stderr.length >= MAX_OUTPUT_BYTES;

    let finalStdout = runResult.stdout;
    let finalStderr = runResult.stderr;
    if (truncated) {
      if (finalStdout.length >= MAX_OUTPUT_BYTES) finalStdout += '\n\n[Output truncated]';
      if (finalStderr.length >= MAX_OUTPUT_BYTES) finalStderr += '\n\n[Output truncated]';
    }

    if (timedOut) {
      return { status: 'timeout', stdout: finalStdout, stderr: finalStderr, exitCode: runResult.exitCode, executionTimeMs, memoryLimitMb: config.memoryMb, timedOut: true, truncated };
    }

    if (runResult.exitCode !== 0) {
      return { status: 'runtime_error', stdout: finalStdout, stderr: finalStderr || `Process exited with code ${runResult.exitCode}`, exitCode: runResult.exitCode, executionTimeMs, memoryLimitMb: config.memoryMb, timedOut: false, truncated };
    }

    return { status: 'completed', stdout: finalStdout, stderr: finalStderr, exitCode: 0, executionTimeMs, memoryLimitMb: config.memoryMb, timedOut: false, truncated };

  } finally {
    // Always clean up the per-run subdirectory from the host volume
    await fs.rm(hostRunDir, { recursive: true, force: true }).catch(() => {});
  }
}
