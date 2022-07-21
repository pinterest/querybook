export interface IAdhocQuery {
    query?: string;
    templatedVariables?: Record<string, any>;
    engineId?: number;
    executionId?: number;
}
