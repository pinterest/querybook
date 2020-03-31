import React, { useEffect } from 'react';
import { formatError } from 'lib/utils/error';

import { Loading } from 'ui/Loading/Loading';
import { ErrorMessage } from 'ui/Message/ErrorMessage';

export interface ILoaderProps {
    // We check the value of item to see if it needs to be loaded, must not be null
    item: any;

    // Something unique identifies the item, can be undefined as well
    itemKey?: any;

    itemLoader?: () => any;
    // Clean up the loading if there is any
    itemUnloader?: () => any;

    // custom
    placeHolder?: React.ReactNode;
    // Custom renderer function that lets user render after load
    renderer?: () => React.ReactNode;
    // Custom renderer when itemLoader throws an exception
    errorRenderer?: (error: any) => React.ReactNode;
    // Custom renderer when null gets loaded
    emptyRenderer?: () => React.ReactNode;

    children?: any;
}

export interface ILoaderState {
    hasError: boolean;
    errorObj: any;
}

export const Loader: React.FunctionComponent<ILoaderProps> = ({
    item,
    itemKey,
    itemLoader,
    itemUnloader,
    placeHolder,
    renderer,
    errorRenderer,
    emptyRenderer,
    children,
}) => {
    // If no item, then its loading (or going to be), otherwise its not loading
    const [isLoading, setIsLoading] = React.useState(!item);
    const [hasError, setHasError] = React.useState(false);
    const [errorObj, setErrorObj] = React.useState(null);

    useEffect(() => {
        if (item == null) {
            setHasError(false);
            setErrorObj(null);
            setIsLoading(true);

            (async () => {
                try {
                    await itemLoader();
                    setIsLoading(false);
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

    if (hasError) {
        return errorRenderer ? (
            errorRenderer(errorObj)
        ) : (
            <ErrorMessage>{formatError(errorObj)}</ErrorMessage>
        );
    } else if (isLoading) {
        return placeHolder ? placeHolder : <Loading />;
    } else if (item == null) {
        // We already tried to load and nothing gets returned;
        // temporaily just return null
        return emptyRenderer ? emptyRenderer() : null;
    }

    return renderer ? renderer() : children;
};
