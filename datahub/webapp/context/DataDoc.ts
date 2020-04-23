import React from 'react';
import { IDataCellMeta } from 'const/datadoc';

export interface IDataDocContextType {
    cellIdToExecutionId: Record<number, number>;
    onQueryCellSelectExecution: (cellId: number, executionId: number) => any;

    insertCellAt?: (
        index: number,
        cellKey: string,
        context: string,
        meta: IDataCellMeta
    ) => any;

    defaultCollapse: boolean;
    focusedCellIndex?: number;
    highlightCellIndex: number;
    cellFocus: {
        onUpKeyPressed: (index: number) => any;
        onDownKeyPressed: (index: number) => any;
        onFocus: (index: number) => any;
        onBlur: (index: number) => any;
    };

    isEditable: boolean;
}

export const DataDocContext = React.createContext<IDataDocContextType>(null);
