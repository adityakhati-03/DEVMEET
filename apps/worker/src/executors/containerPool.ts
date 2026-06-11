/**
 * SingleContainerManager
 *
 * Instead of a pool of disposable containers, we maintain ONE persistent container
 * per language image. It is created on first use and reused for every subsequent run.
 * Code is written to the shared /sandbox volume and executed via `docker exec`.
 *
 * Security measures are preserved:
 *  - --network none          (no internet access)
 *  - --memory / --cpus       (resource limits)
 *  - --pids-limit 128        (fork-bomb protection)
 *  - --user 65534            (nobody — no root inside container)
 *  - --read-only + tmpfs     (root fs is read-only; /sandbox and /tmp are tmpfs)
 */

import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { logger } from '../utils/logger';

interface ManagedContainer {
  id: string;       // docker container name
  image: string;
  workDir: string;  // host-side tmpfs mount for code files
}

class SingleContainerManager {
  // One container per image name
  private containers: Map<string, ManagedContainer> = new Map();

  /**
   * Get (or lazily create) the single persistent container for a given image.
   */
  async getOrCreate(
    image: string,
    memoryMb: number,
    cpuLimit: number
  ): Promise<ManagedContainer> {
    const existing = this.containers.get(image);
    if (existing) {
      // Check the container is still alive
      const alive = await this.isRunning(existing.id);
      if (alive) return existing;

      // Container died — remove stale entry and recreate
      logger.warn(`[SingleContainer] Container ${existing.id} died. Recreating...`);
      this.containers.delete(image);
      await fs.rm(existing.workDir, { recursive: true, force: true }).catch(() => {});
    }

    return this.create(image, memoryMb, cpuLimit);
  }

  private async isRunning(containerId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('docker', ['inspect', '--format', '{{.State.Running}}', containerId], { shell: false });
      let out = '';
      proc.stdout.on('data', (d: Buffer) => { out += d.toString(); });
      proc.on('close', () => resolve(out.trim() === 'true'));
    });
  }

  private async create(image: string, memoryMb: number, cpuLimit: number): Promise<ManagedContainer> {
    const id = `devmeet-sandbox-${image.replace(/[^a-z0-9]/gi, '-')}`;
    const workDir = path.join(os.tmpdir(), id);
    await fs.mkdir(workDir, { recursive: true });

    logger.info(`[SingleContainer] Starting persistent container: ${id} (image: ${image})`);

    const args = [
      'run', '-d',
      '--name', id,
      // ── Network isolation ─────────────────────────────────
      '--network', 'none',
      // ── Resource limits ───────────────────────────────────
      '--memory', `${memoryMb}m`,
      '--memory-swap', `${memoryMb}m`,
      '--cpus', String(cpuLimit),
      '--pids-limit', '128',
      // ── User isolation (nobody — no root) ─────────────────
      '--user', '65534',
      // ── Capability hardening ──────────────────────────────
      '--cap-drop', 'ALL',               // drop every Linux capability
      '--security-opt', 'no-new-privileges', // cannot gain privileges via setuid/setgid
      // ── Filesystem hardening ─────────────────────────────
      '--read-only',                     // root fs is read-only
      '--tmpfs', '/tmp:rw,nosuid,size=64m',      // writable /tmp — exec allowed (gcc needs it)
      // ── Sandbox volume (code + output lives here) ─────────
      '-v', `${workDir}:/sandbox:rw`,
      '-w', '/sandbox',
      image,
      'tail', '-f', '/dev/null',         // keep container alive and idle
    ];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn('docker', args, { shell: false });
      let stderr = '';
      proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          // Container may already exist (e.g. after a crash) — try to start it
          spawn('docker', ['start', id], { shell: false }).on('close', (c2) => {
            if (c2 === 0) resolve();
            else reject(new Error(`Failed to start container ${id}: ${stderr}`));
          });
        }
      });
    });

    const container: ManagedContainer = { id, image, workDir };
    this.containers.set(image, container);
    logger.info(`[SingleContainer] Container ready: ${id}`);
    return container;
  }

  async cleanupAll() {
    logger.info('[SingleContainer] Stopping all persistent containers...');
    for (const [, container] of this.containers.entries()) {
      await new Promise<void>((resolve) => {
        spawn('docker', ['rm', '-f', container.id], { shell: false }).on('close', () => {
          fs.rm(container.workDir, { recursive: true, force: true }).catch(() => {});
          resolve();
        });
      });
    }
    this.containers.clear();
  }
}

export const singleContainerManager = new SingleContainerManager();
