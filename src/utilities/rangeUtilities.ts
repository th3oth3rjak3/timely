export function createRange(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
}
