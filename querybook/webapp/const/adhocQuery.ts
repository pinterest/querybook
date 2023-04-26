import { IDataDocMetaVariable } from './datadoc';

export interface IAdhocQuery {
    query?: string;
    templatedVariables?: IDataDocMetaVariable[];
    engineId?: number;
    executionId?: number;
    rowLimit?: number;
    selectedExec?: number;
}
