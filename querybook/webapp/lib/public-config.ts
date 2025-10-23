import PublicConfig from 'config/querybook_public_config.yaml';

export const isAIFeatureEnabled = (
    featureKey?:
        | 'query_title_generation'
        | 'query_generation'
        | 'query_auto_fix'
        | 'table_vector_search'
        | 'query_vector_search'
        | 'sql_complete'
        | 'data_doc_title_generation'
): boolean => {
    const aiAssistantConfig = PublicConfig.ai_assistant;
    if (!featureKey) {
        return aiAssistantConfig.enabled;
    }
    return aiAssistantConfig.enabled && aiAssistantConfig[featureKey].enabled;
};

export const TABLE_SAMPLING_CONFIG = PublicConfig.table_sampling ?? {
    enabled: false,
    sample_rates: [],
    default_sample_rate: 0,
    sample_user_guide_link: '',
    sampling_tool_tip_delay: 0,
};

export const getTableSamplingRateOptions = () => {
    const sampleRates = TABLE_SAMPLING_CONFIG.sample_rates;

    // add the none option
    if (!sampleRates.includes(0)) {
        sampleRates.unshift(0);
    }

    return sampleRates.map((rate) => ({
        key: rate,
        value: rate,
        label: rate === 0 ? 'none' : rate + '%',
    }));
};

export const PEER_REVIEW_CONFIG = PublicConfig.peer_review ?? {
    enabled: false,
    request_texts: {
        description: '',
        guide_link: '',
        tip: '',
    },
    reviewer_texts: {
        approve_message: '',
    },
};
