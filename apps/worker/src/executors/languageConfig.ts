import type { LanguageConfig } from './types';

/**
 * Language ID → Docker execution config.
 * Supports JavaScript (1), Python (2), C (3), C++ (4), Java (5), Go (6), Ruby (7), PHP (8), Rust (9).
 * The languageId matches the SUPPORTED_LANGUAGES IDs in @devmeet/shared.
 */
export const DOCKER_LANGUAGE_CONFIGS: Record<number, LanguageConfig> = {
  // JavaScript (Node.js 22)
  1: {
    image: 'node:22-slim',
    filename: 'main.js',
    compileCmd: null,
    runCmd: ['node', 'main.js'],
    compileTimeoutMs: 0,       // no compile step
    timeoutMs: 10_000,
    memoryMb: 128,
    cpuLimit: 1.0,
  },

  // Python
  2: {
    image: 'python:3.12-slim',
    filename: 'main.py',
    compileCmd: null,
    runCmd: ['python', 'main.py'],
    compileTimeoutMs: 0,       // no compile step
    timeoutMs: 10_000,
    memoryMb: 128,
    cpuLimit: 1.0,
  },

  // C++ (gcc)
  4: {
    image: 'gcc:latest',
    filename: 'main.cpp',
    compileCmd: ['g++', '-O2', '-o', 'main', 'main.cpp'],
    runCmd: ['./main'],
    compileTimeoutMs: 30_000,  // compile can take up to 30s
    timeoutMs: 10_000,
    memoryMb: 256,
    cpuLimit: 1.0,             // full core for faster compilation
  },

  // C (gcc)
  3: {
    image: 'gcc:latest',
    filename: 'main.c',
    compileCmd: ['gcc', '-O2', '-o', 'main', 'main.c'],
    runCmd: ['./main'],
    compileTimeoutMs: 30_000,
    timeoutMs: 10_000,
    memoryMb: 256,
    cpuLimit: 1.0,
  },

  // Java
  5: {
    image: 'openjdk:22-slim',
    filename: 'Main.java',
    compileCmd: ['javac', 'Main.java'],
    runCmd: ['java', 'Main'],
    compileTimeoutMs: 30_000,
    timeoutMs: 10_000,
    memoryMb: 512, // Java needs more memory
    cpuLimit: 1.0,
  },

  // Go
  6: {
    image: 'golang:1.23-alpine',
    filename: 'main.go',
    compileCmd: ['go', 'build', '-o', 'main', 'main.go'],
    runCmd: ['./main'],
    compileTimeoutMs: 30_000,
    timeoutMs: 10_000,
    memoryMb: 256,
    cpuLimit: 1.0,
  },

  // Ruby
  7: {
    image: 'ruby:3.4-slim',
    filename: 'main.rb',
    compileCmd: null,
    runCmd: ['ruby', 'main.rb'],
    compileTimeoutMs: 0,
    timeoutMs: 10_000,
    memoryMb: 128,
    cpuLimit: 1.0,
  },

  // PHP
  8: {
    image: 'php:8.3-cli-alpine',
    filename: 'main.php',
    compileCmd: null,
    runCmd: ['php', 'main.php'],
    compileTimeoutMs: 0,
    timeoutMs: 10_000,
    memoryMb: 128,
    cpuLimit: 1.0,
  },

  // Rust
  9: {
    image: 'rust:1.82-slim',
    filename: 'main.rs',
    compileCmd: ['rustc', '-O', '-o', 'main', 'main.rs'],
    runCmd: ['./main'],
    compileTimeoutMs: 60_000, // Rust compilation can be slow
    timeoutMs: 10_000,
    memoryMb: 512,
    cpuLimit: 1.0,
  },
};

/** Language IDs supported by the Docker runner */
export const DOCKER_SUPPORTED_IDS = new Set(Object.keys(DOCKER_LANGUAGE_CONFIGS).map(Number));
