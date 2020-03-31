import { useState, useEffect } from 'react';

export interface ILoaderProps {
    // We check the value of item to see if it needs to be loaded, must not be null
    item: any;

    // Something unique identifies the item, can be undefined as well
    itemKey?: any;

    itemLoader: () => any;
    // Clean up the loading if there is any
    itemUnloader?: () => any;
}

export function useLoader({
    item,
    itemKey,
    itemLoader,
    itemUnloader,
}: ILoaderProps) {
    const [hasError, setHasError] = useState(false);
    const [errorObj, setErrorObj] = useState(null);
    const [loading, setLoading] = useState(item == null);

    useEffect(() => {
        if (item == null) {
            setHasError(false);
            setErrorObj(null);
            (async () => {
                try {
                    setLoading(true);
                    await itemLoader();
                    setLoading(false);
                } catch (errorObj) {
                    console.error(errorObj);
                    setHasError(true);
                    setErrorObj(errorObj);
                }
            })();
        }

        return () => {
            if (itemUnloader) {
                itemUnloader();
            }
        };
    }, [itemKey, itemUnloader]);

    return {
        loading,
        hasError,
        errorObj,
    };
}
