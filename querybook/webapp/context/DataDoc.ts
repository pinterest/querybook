import React from 'react';

import { DataCellUpdateFields, IDataCellMeta } from 'const/datadoc';

export interface IDataDocContextType {
    cellIdToExecutionId: Record<number, number>;
    onQueryCellSelectExecution: (cellId: number, executionId: number) => any;

    insertCellAt?: (
        index: number,
        cellKey: string,
        context: string,
        meta: IDataCellMeta
    ) => Promise<any>;
    updateCell: (cellId: number, fields: DataCellUpdateFields) => Promise<any>;
    copyCellAt: (index: number, cut: boolean) => void;
    pasteCellAt: (pasteIndex: number) => Promise<void>;
    deleteCellAt: (index: number) => Promise<void>;
    fullScreenCellAt: (index: number) => void;

    defaultCollapse: boolean;
    highlightCellIndex: number;
    fullScreenCellIndex: number;

    cellFocus: {
        onUpKeyPressed: (index: number) => any;
        onDownKeyPressed: (index: number) => any;
        onFocus: (index: number) => any;
        onBlur: (index: number) => any;
    };

    isEditable: boolean;
}

export const DataDocContext = React.createContext<IDataDocContextType>(null);
