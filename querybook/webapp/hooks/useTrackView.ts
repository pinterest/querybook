import { useEffect } from 'react';

import { ComponentType } from 'const/analytics';
import { trackView } from 'lib/analytics';

export function useTrackView(component: ComponentType) {
    useEffect(() => {
        trackView(component);
    }, [component]);
}
