import ds from 'lib/datasource';

export const AnalyticsResource = {
    create: (eventType, eventData) =>
        ds.save<string>(`/event_log/`, {
            event_type: eventType,
            event_data: eventData,
        }),
};
