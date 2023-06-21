import { useCallback, useState } from 'react';

import ds from 'lib/datasource';

export function useStream(
    url: string,
    params: Record<string, unknown> = {}
): {
    isStreaming: boolean;
    data: { [key: string]: string } | null;
    startStream: () => void;
} {
    const [isStreaming, setIsStreaming] = useState(false);
    const [data, setData] = useState<{ [key: string]: string } | null>(null);

    const startStream = useCallback(() => {
        setIsStreaming(true);
        setData({});

        ds.stream(
            url,
            params,
            (data: { [key: string]: string }) => {
                setData(data);
            },
            () => {
                setIsStreaming(false);
            }
        );
    }, [url, params]);

    return {
        isStreaming,
        data,
        startStream,
    };
}
