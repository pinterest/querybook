import { useEffect } from 'react';

import { ComponentType, ElementType } from 'const/analytics';
import { trackView } from 'lib/analytics';

export function useTrackView(
    component: ComponentType,
    element?: ElementType,
    aux?: object
) {
    useEffect(() => {
        trackView(component, element, aux);
    }, [component, element, aux]);
}
