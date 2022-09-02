export function isBoolean(b: any): boolean {
    return [true, 'true', false, 'false'].includes(b);
}
