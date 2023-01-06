import { TTrackEventProp } from 'const/analytics';
import { trackClick } from 'lib/analytics';
import { Nullable } from 'lib/typescript';
import { useCallback } from 'react';

export function useEventTrackClick<E = never>(
    onClick: Nullable<(e?: E) => any>,
    trackEvent: TTrackEventProp
) {
    return useCallback(() => {
        const eventData =
            typeof trackEvent === 'function' ? trackEvent() : trackEvent;
        trackClick(eventData);

        return onClick?.();
    }, [onClick, trackEvent]);
}
