import { useEffect, useState } from 'react';

export default () => {
    const [scrollY, setScrollY] = useState(window.scrollY);
    useEffect(() => {
        const scrollListener = () => {
            setScrollY(window.scrollY);
        };
        document.addEventListener('scroll', scrollListener);
        return () => {
            document.removeEventListener('scroll', scrollListener);
        };
    }, []);

    return scrollY;
};
