import { useEffect, useState } from 'react';

export default () => {
    const [scrollY, setScrollY] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.scrollY;
        }
        return 0;
    });
    useEffect(() => {
        let scrollListener;
        if (typeof window !== 'undefined') {
            scrollListener = () => {
                setScrollY(window.scrollY);
            };
            document.addEventListener('scroll', scrollListener);
        }
        return () => {
            if (scrollListener) {
                document.removeEventListener('scroll', scrollListener);
            }
        };
    }, []);

    return scrollY;
};
