import type {
    ISurvey,
    IUpdateSurveyFormData,
    ICreateSurveyFormData,
} from 'const/survey';
import ds from 'lib/datasource';

export const SurveyResource = {
    createSurvey: (surveyData: ICreateSurveyFormData) =>
        ds.save<ISurvey>('/survey/', surveyData as Record<string, any>),

    updateSurvey: (surveyId: number, surveyData: IUpdateSurveyFormData) =>
        ds.update<ISurvey>(
            `/survey/${surveyId}/`,
            surveyData as Record<string, any>
        ),
};
