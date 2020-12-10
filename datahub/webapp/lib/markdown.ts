/*
We define a special format markdown such as

---
property_1: foo
property_2: bar
---
**Hello** _World_

This function would extract and remove the property part from markdown
so we get:

markdown: **Hello** _World_
property: { property_1: "foo", property_2: "bar"}

*/
export function sanitizeAndExtraMarkdown(
    markdown: string
): [string, Record<string, string>] {
    const lines = markdown.split('\n');
    const filteredLines: string[] = [];
    const properties: Record<string, string> = {};

    // Remove --- blocks from markdown
    let insidePropertyBlock = false;
    for (const line of lines) {
        if (line.startsWith('---')) {
            insidePropertyBlock = !insidePropertyBlock;
        } else {
            if (insidePropertyBlock) {
                const parts = line.split(':');
                if (parts.length === 2) {
                    properties[parts[0].trim()] = parts[1].trim();
                }
            } else {
                filteredLines.push(line);
            }
        }
    }

    return [filteredLines.join('\n'), properties];
}
