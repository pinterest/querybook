import { IQueryEngine, IQueryTranspiler } from 'const/queryEngine';

export interface IPossibleTranspilation {
    transpilerName: string;
    toEngine: IQueryEngine;
}

export function getPossibleTranspilers(
    transpilers: IQueryTranspiler[],
    queryEngine: IQueryEngine,
    queryEngines: IQueryEngine[]
): IPossibleTranspilation[] {
    const filteredQueryEngines = queryEngines.filter(
        (q) => q.language !== queryEngine.language
    );
    const filteredTranspilers = transpilers.filter((t) =>
        t.from_languages.includes(queryEngine.language)
    );

    const possibleTranspilations: IPossibleTranspilation[] = [];
    for (const toQueryEngine of filteredQueryEngines) {
        const transpiler = filteredTranspilers.find((t) =>
            t.to_languages.includes(toQueryEngine.language)
        );
        if (transpiler) {
            possibleTranspilations.push({
                transpilerName: transpiler.name,
                toEngine: toQueryEngine,
            });
        }
    }
    return possibleTranspilations;
}
