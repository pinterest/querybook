import { ComponentType, EventData, EventType } from 'const/analytics';
import { AnalyticsResource } from 'resource/analytics';

const track = (eventType: EventType, eventData: EventData) => {
    AnalyticsResource.create(eventType, eventData);
};

export const trackView = (component?: ComponentType) => {
    const eventData = {
        path: location.pathname,
        component,
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
