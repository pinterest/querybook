import { useEffect, useRef } from 'react';
import { setBrowserTitle } from 'lib/dataHubUI';

export function useBrowserTitle(title: string) {
    const oldTitle = useRef(document.title);
    useEffect(() => {
        setBrowserTitle(title);
    }, [title]);

    // Unset the title when unmounting
    useEffect(() => {
        return () => {
            setBrowserTitle(oldTitle.current);
        };
    }, []);
}
