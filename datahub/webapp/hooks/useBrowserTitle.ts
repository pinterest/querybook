import { useEffect, useRef } from 'react';
import { setBrowserTitle } from 'lib/globalUI';

export function useBrowserTitle(title = '') {
    const oldTitle = useRef(document.title);
    useEffect(() => {
        setBrowserTitle(title);
    }, [title]);

    // Unset the title when unmounting
    useEffect(
        () => () => {
            setBrowserTitle(oldTitle.current, false);
        },
        []
    );
}
