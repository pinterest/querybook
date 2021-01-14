import { useState, useEffect } from 'react';

export function useMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => {
            setMounted(false);
        };
    }, []);
    return mounted;
}
