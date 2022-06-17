import { useEffect, useState } from 'react';

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
    const [loading, setLoading] = useState(!item);
    const [hasError, setHasError] = useState(false);
    const [errorObj, setErrorObj] = useState(null);
    useEffect(() => {
        if (item == null) {
            setHasError(false);
            setErrorObj(null);
            setLoading(true);

            (async () => {
                try {
                    await itemLoader();
                    setLoading(false);
                } catch (errorObj) {
                    console.error(errorObj);
                    setErrorObj(errorObj);
                    setHasError(true);
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
