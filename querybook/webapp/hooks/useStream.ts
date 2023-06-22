import { useCallback, useState } from 'react';

import ds from 'lib/datasource';

export enum StreamStatus {
    NOT_STARTED,
    STREAMING,
    FINISHED,
}

export function useStream(
    url: string,
    params: Record<string, unknown> = {}
): {
    streamStatus: StreamStatus;
    streamData: { [key: string]: string };
    startStream: () => void;
    resetStream: () => void;
} {
    const [streamStatus, setSteamStatus] = useState(StreamStatus.NOT_STARTED);
    const [data, setData] = useState<{ [key: string]: string }>({});

    const startStream = useCallback(() => {
        setSteamStatus(StreamStatus.STREAMING);
        setData({});

        ds.stream(url, params, setData, () => {
            setSteamStatus(StreamStatus.FINISHED);
        });
    }, [url, params]);

    const resetStream = useCallback(() => {
        setSteamStatus(StreamStatus.NOT_STARTED);
        setData({});
    }, []);

    return {
        streamStatus,
        streamData: data,
        startStream,
        resetStream,
    };
}
