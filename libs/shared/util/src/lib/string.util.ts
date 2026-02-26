export function escapeLikePattern(pattern: string): string {
    return pattern.replace(/[%_\\]/g, (char) => `\\${char}`);
}
