import { IFunctionDescription } from 'const/metastore';
import ds from 'lib/datasource';

export const FunctionDocumentationResource = {
    getByLanguage: (language: string) =>
        ds.fetch<IFunctionDescription[]>(
            `/function_documentation_language/${language}/`
        ),
};
