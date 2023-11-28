export interface ISurvey {
    id: number;
    created_at: number;
    updated_at: number;

    surface: SurveySurfaceType;
    surface_metadata: Record<string, any>;
    rating: number;
    comment: string;

    uid: number;
}

export interface ICreateSurveyFormData {
    surface: SurveySurfaceType;
    surface_metadata: Record<string, any>;
    rating: number;
    comment?: string | null;
}

export interface IUpdateSurveyFormData {
    rating?: number;
    comment?: string | null;
}

export enum SurveySurfaceType {
    TABLE_SEARCH = 'table_search',
    TABLE_TRUST = 'table_view',
    TEXT_TO_SQL = 'text_to_sql',
    QUERY_AUTHORING = 'query_authoring',
}

export const SurveyTypeToQuestion: Record<SurveySurfaceType, string> = {
    [SurveySurfaceType.TABLE_SEARCH]:
        'Did this search help you find the right table?',
    [SurveySurfaceType.TABLE_TRUST]: 'Do you trust {table_name}?',
    [SurveySurfaceType.TEXT_TO_SQL]: 'Was Text2SQL helpful with your task?',
    [SurveySurfaceType.QUERY_AUTHORING]:
        'Were you able to write this query efficiently?',
};
