import { AnalyticsEvent } from 'const/analytics';
import ds from 'lib/datasource';

export const AnalyticsResource = {
    create: (events: AnalyticsEvent[]) => ds.save(`/event_log/`, { events }),
};
