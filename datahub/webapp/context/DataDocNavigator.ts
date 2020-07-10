import React from 'react';
import { IDataCellMeta, DataCellUpdateFields } from 'const/datadoc';

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

export const DataDocNavigatorContext = React.createContext<IDataDocContextType>(
    null
);
