export function normalizeOutput(output: string): string {
  if (typeof output !== 'string') return '';
  return output
    .replace(/\r\n/g, '\n') // Normalize CRLF to LF
    .replace(/\r/g, '\n')   // Normalize CR to LF
    .trim();                // Trim start and end whitespace
}

export function compareOutput(actual: string, expected: string): boolean {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);
  return normActual === normExpected;
}
