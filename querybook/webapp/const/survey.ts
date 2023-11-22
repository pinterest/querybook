export interface ISurvey {
    id: number;
    created_at: number;
    updated_at: number;

    surface: string;
    surface_metadata: Record<string, any>;
    rating: number;
    comment: string;

    uid: number;
}

export interface ICreateSurveyFormData {
    surface: string;
    surface_metadata: Record<string, any>;
    rating: number;
    comment?: string | null;
}

export interface IUpdateSurveyFormData {
    rating?: number;
    comment?: string | null;
}
