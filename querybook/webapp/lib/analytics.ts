import {
    AnalyticsEvent,
    ComponentType,
    ElementType,
    EventData,
    EventType,
} from 'const/analytics';
import { BatchManager, mergeListFunction } from 'lib/batch/batch-manager';
import { AnalyticsResource } from 'resource/analytics';

const analyticsManager = new BatchManager<AnalyticsEvent, AnalyticsEvent[]>({
    batchFrequency: 2000,
    processFunction: async (events: AnalyticsEvent[]) => {
        await AnalyticsResource.create(events);
    },
    mergeFunction: mergeListFunction,
});

const track = (eventType: EventType, eventData: EventData) => {
    analyticsManager.batch({
        type: eventType,
        data: eventData,
        timestamp: Date.now(),
    });
};

export const trackView = (
    component?: ComponentType,
    element?: ElementType,
    aux?: object
) => {
    const eventData = {
        path: location.pathname,
        component,
        element,
        aux,
    };
    track(EventType.VIEW, eventData);
};

export const trackClick = ({ component, element, aux }: Partial<EventData>) => {
    const eventData = {
        path: location.pathname,
        component,
        element,
        aux,
    };
    track(EventType.CLICK, eventData);
};
