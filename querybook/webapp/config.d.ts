declare module 'config/datadoc.yaml' {
    const data: {
        cell_types: Record<
            string,
            {
                key: string;
                icon: string;
                name?: string;
                meta: Record<string, unknown>;
                meta_default: Record<string, unknown>;
            }
        >;
    };
    export default data;
}

declare module 'config/faqs.yaml' {
    const data: {
        faqs: Array<{ q: string; a: string }>;
    };
    export default data;
}

declare module 'config/loading_hints.yaml' {
    const data: {
        hints: string[];
    };
    export default data;
}

declare module 'config/type_info.yaml' {
    const data: Record<string, string>;
    export default data;
}

declare module 'config/user_setting.yaml' {
    const data: Record<
        string,
        {
            options: Array<
                | string
                | {
                      value: string;
                      key: string;
                  }
            >;
            default: string;
            helper: string;
            tab: UserSettingsTab;
            per_env?: boolean;
        }
    >;
    export default data;
}

declare module 'config/query_result_limit.yaml' {
    const data: {
        default_query_result_size: number;
        query_result_size_options: number[];
    };
    export default data;
}

declare module 'config/query_error.yaml' {
    const data: Record<
        string,
        Record<
            string,
            {
                regex: string;
                message: string;
            }
        >
    >;
    export default data;
}

declare module 'config/color_palette.yaml' {
    const data: Array<{
        name: string;
        color: string;
        fillColor: string;
    }>;
    export default data;
}

declare module 'config/querybook_public_config.yaml' {
    const data: {
        ai_assistant: {
            enabled: boolean;
            query_title_generation: {
                enabled: boolean;
            };
            query_generation: {
                enabled: boolean;
            };

            query_auto_fix: {
                enabled: boolean;
            };

            table_vector_search: {
                enabled: boolean;
            };
        };
        survey?: {
            global_response_cooldown?: number;
            global_trigger_cooldown?: number;
            global_trigger_duration?: number;
            global_max_per_week?: number;
            global_max_per_day?: number;

            surfaces?: Array<{
                surface: string;
                response_cooldown?: number;
                trigger_cooldown?: number;
                trigger_duration?: number;
                max_per_week?: number;
                max_per_day?: number;
            }>;
        };
        table_sampling?: {
            enabled: boolean;
            sample_rates: Array<number>;
            default_sample_rate: number;
            sample_user_guide_link: string;
            sampling_tool_tip_delay: number;
        };
    };
    export default data;
}
