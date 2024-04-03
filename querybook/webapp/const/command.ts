import { AICommandType } from './aiAssistant';

export enum QueryCellCommandType {
    SYNC = 'sync', // Command that is executed synchronously
    ASYNC = 'async', // Command that is executed asynchronously, e.g. API
    AI = 'ai', // Command that is executed by AI assistant, which is through websocket
}
export interface IQueryCellCommand {
    name: string;
    hint: string;
    type: QueryCellCommandType;
    inplace: boolean; // Whether the command will modify the cell content directly
    aiCommand?: AICommandType;
}

export const QUERY_CELL_COMMANDS: Array<IQueryCellCommand> = [
    {
        name: 'generate',
        hint: 'Generate a new query',
        type: QueryCellCommandType.AI,
        inplace: false,
        aiCommand: AICommandType.TEXT_TO_SQL,
    },
    {
        name: 'edit',
        hint: 'Edit the query',
        type: QueryCellCommandType.AI,
        inplace: false,
        aiCommand: AICommandType.TEXT_TO_SQL,
    },
    {
        name: 'format',
        hint: 'Format the query',
        type: QueryCellCommandType.SYNC,
        inplace: true,
    },
];
