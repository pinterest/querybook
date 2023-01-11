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
