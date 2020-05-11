type DAG = Record<string, string[]>;

function detectCycleHelper(node: string, dag: DAG, seen: Set<string>) {
    if (seen.has(node)) {
        return true;
    }

    seen.add(node);

    for (const child of dag[node] ?? []) {
        if (detectCycleHelper(child, dag, seen)) {
            return true;
        }
    }
    seen.delete(node);
    return false;
}

// True if has cycle, False otherwise
export function detectCycle(dag: DAG): boolean {
    const seen = new Set<string>();
    return Object.keys(dag).some((node) => detectCycleHelper(node, dag, seen));
}
