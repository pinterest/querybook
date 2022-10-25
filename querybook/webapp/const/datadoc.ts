import { ContentState } from 'draft-js';
import { Edge, Node } from 'react-flow-renderer';

import { IChartConfig } from './dataDocChart';

export type CELL_TYPE = 'query' | 'text' | 'chart';

export interface IDataCellBase {
    id: number;

    created_at: number;
    updated_at: number;

    docId: number;
}

export interface IDataCellMetaBase {
    collapsed?: boolean;
}

export interface IDataQueryCellMeta extends IDataCellMetaBase {
    title?: string;
    engine?: number;
    query_collapsed?: boolean;
    limit?: number;
}

export interface IDataQueryCell extends IDataCellBase {
    cell_type: 'query';
    context: string;
    meta: IDataQueryCellMeta;
}

export interface IDataTextCell extends IDataCellBase {
    cell_type: 'text';
    context: ContentState;
    meta: IDataCellMetaBase;
}

export type IDataChartCellMeta = IDataCellMetaBase & IChartConfig;

export type IDataCellMeta =
    | IDataQueryCellMeta
    | IDataCellMetaBase
    | IDataChartCellMeta;

export interface IDataChartCell extends IDataCellBase {
    cell_type: 'chart';
    context: string;
    meta: IDataChartCellMeta;
}

export type IDataCell = IDataQueryCell | IDataTextCell | IDataChartCell;
export type DataCellUpdateFields = Partial<Pick<IDataCell, 'context' | 'meta'>>;

export interface IDataDoc {
    dataDocCells: IDataCell[];
    id: number;
    public: boolean;
    archived: boolean;

    environment_id: number;
    owner_uid: number;
    created_at: number;
    updated_at: number;

    meta: Record<string, any>;
    title: string;

    cells?: number[];
}

export type IRawDataDoc = Omit<IDataDoc, 'cells' | 'dataDocCells'> & {
    cells: IDataCell[];
};

export interface IDataDocEditor {
    id: number;
    data_doc_id: number;
    uid: number;

    read: boolean;
    write: boolean;
}

export const emptyDataDocTitleMessage = '(Untitled)';

export interface IDataDocDAGExportMeta {
    exporter_meta?: {
        [exporterName: string]: Record<string, any>;
    };
    useTemplatedVariables?: boolean;
}

export interface IDataDocDAGExport {
    selectedExporter?: string;
    savedDAGExport?: IDataDocSavedDAGExport;
}

export interface IDataDocSavedDAGExport {
    id: number;
    data_doc_id: number;

    created_at: number;
    updated_at: number;

    dag: Record<string, Node[] | Edge[]>;
    meta: IDataDocDAGExportMeta;
}

export interface IDataDocDAGExporter {
    name: string;
    engines: number[];
    meta: IFormField | IStructFormField | IExpandableFormField;
}
