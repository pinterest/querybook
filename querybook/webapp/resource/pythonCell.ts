import type { IPythonCellResult } from 'const/datadoc';
import ds from 'lib/datasource';

export const PythonCellResource = {
    getResult: (cellId: number) =>
        ds.fetch<IPythonCellResult>(`/python_cell/${cellId}/result/`),

    updateResult: (cellId: number, output: any[], error: string) => {
        return ds.update<void>(`/python_cell/${cellId}/result/`, {
            output,
            error,
        });
    },
};
