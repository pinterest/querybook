import PublicConfig from 'config/querybook_public_config.yaml';
import type { ISurveyConfig } from './types';

const surveyConfig = PublicConfig.survey;

export const SURVEY_CONFIG: Record<string, ISurveyConfig> = {};
surveyConfig?.surfaces?.forEach((surface) => {
    SURVEY_CONFIG[surface.surface] = {
        surface: surface.surface,
        responseCooldown:
            surface.response_cooldown ??
            surveyConfig.global_response_cooldown ??
            2592000, // 30 days
        triggerCooldown:
            surface.trigger_cooldown ??
            surveyConfig.global_trigger_cooldown ??
            600, // 10 minutes
        triggerDuration:
            surface.trigger_duration ??
            surveyConfig.global_trigger_duration ??
            60, // 1 minute
        maxPerWeek:
            surface.max_per_week ?? surveyConfig.global_max_per_week ?? 3,
        maxPerDay: surface.max_per_day ?? surveyConfig.global_max_per_day ?? 1,
    };
});
