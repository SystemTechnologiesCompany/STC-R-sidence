export function visitPage<T extends string>(history: T[], next: T, root: T): T[] {
  if (history[history.length - 1] === next) return history;
  if (next === root) return [root];
  return [...history, next];
}
export function previousPage<T extends string>(history: T[]): T[] {
  return history.length > 1 ? history.slice(0, -1) : history;
}
