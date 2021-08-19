import { IFunctionDescription } from 'const/metastore';
import ds from 'lib/datasource';

export function getFunctionDocumentation(language: string) {
    return ds.fetch<IFunctionDescription[]>(
        `/function_documentation_language/${language}/`
    );
}
