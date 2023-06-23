import { AnalyticsEvent } from 'const/analytics';

export const AnalyticsResource = {
    create: (events: AnalyticsEvent[]) => {
        navigator.sendBeacon(`/ds/context_log/`, JSON.stringify(events));
    },
};
