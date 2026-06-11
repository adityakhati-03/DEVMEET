export const DOCKER_LANGUAGE_MAP: Record<number, string> = {
  1: 'nodejs-20',
  2: 'python-3.12',
  3: 'gcc',
  4: 'gcc',
  5: 'java-22',
  6: 'go-1.23',
  7: 'ruby-3.4',
  8: 'php-8.3',
  9: 'rust-1.82',
};

export const SUPPORTED_LANGUAGES = [
  { id: 1, name: 'JavaScript' },
  { id: 2, name: 'Python' },
  { id: 3, name: 'C' },
  { id: 4, name: 'C++' },
  { id: 5, name: 'Java' },
  { id: 6, name: 'Go' },
  { id: 7, name: 'Ruby' },
  { id: 8, name: 'PHP' },
  { id: 9, name: 'Rust' },
] as const;

