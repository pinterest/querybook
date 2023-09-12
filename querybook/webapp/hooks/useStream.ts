import { useCallback, useRef, useState } from 'react';

import ds from 'lib/datasource';

export enum StreamStatus {
    NOT_STARTED,
    STREAMING,
    FINISHED,
    CANCELLED,
}

export function useStream(
    url: string,
    params: Record<string, unknown> = {}
): {
    streamStatus: StreamStatus;
    streamData: { [key: string]: string };
    startStream: () => void;
    resetStream: () => void;
    cancelStream: () => void;
} {
    const [streamStatus, setSteamStatus] = useState(StreamStatus.NOT_STARTED);
    const [data, setData] = useState<{ [key: string]: string }>({});
    const streamRef = useRef<EventSource | null>(null);

    const startStream = useCallback(() => {
        setSteamStatus(StreamStatus.STREAMING);
        setData({});

        streamRef.current = ds.stream(url, params, setData, (data) => {
            setData(data);
            setSteamStatus(StreamStatus.FINISHED);
        });
    }, [url, params]);

    const resetStream = useCallback(() => {
        setSteamStatus(StreamStatus.NOT_STARTED);
        setData({});
    }, []);

    const cancelStream = useCallback(() => {
        if (streamStatus === StreamStatus.STREAMING) {
            streamRef.current?.close();
            setSteamStatus(StreamStatus.CANCELLED);
        }
    }, [streamStatus]);

    return {
        streamStatus,
        streamData: data,
        startStream,
        resetStream,
        cancelStream,
    };
}
