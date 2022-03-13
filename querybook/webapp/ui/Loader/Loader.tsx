import React from 'react';
import { formatError } from 'lib/utils/error';

import { Loading } from 'ui/Loading/Loading';
import { ErrorMessage } from 'ui/Message/ErrorMessage';
import { useLoader } from 'hooks/useLoader';

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
    const { loading, hasError, errorObj } = useLoader({
        item,
        itemKey,
        itemLoader,
        itemUnloader,
    });

    if (hasError) {
        return errorRenderer ? (
            errorRenderer(errorObj)
        ) : (
            <ErrorMessage>{formatError(errorObj)}</ErrorMessage>
        );
    } else if (loading) {
        return placeHolder ? placeHolder : <Loading fullHeight />;
    } else if (item == null) {
        // We already tried to load and nothing gets returned;
        // temporaily just return null
        return emptyRenderer ? emptyRenderer() : null;
    }

    return renderer ? renderer() : children;
};
