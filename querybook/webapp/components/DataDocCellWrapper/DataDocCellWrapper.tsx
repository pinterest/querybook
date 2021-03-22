import React from 'react';
import ReactLazyLoad from 'react-lazyload';

import { getAnchorNameForCell } from 'lib/data-doc/data-doc-utils';
import { Loading } from 'ui/Loading/Loading';

interface IProps {
    placeholderHeight: number;
    cellKey: string;
}

export const DataDocCellWrapper: React.FunctionComponent<IProps> = ({
    cellKey,
    placeholderHeight,
    children,
}) => {
    const [scrolledToAnchor, setScrolledToAnchor] = React.useState(false);
    const selfRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const shouldScrollOnMount = location.hash.slice(1) === String(cellKey);
        if (selfRef.current && shouldScrollOnMount && !scrolledToAnchor) {
            selfRef.current.scrollIntoView();
            setScrolledToAnchor(true);
        }
    }, [selfRef, scrolledToAnchor, cellKey]);

    const lazyDOM = (
        <ReactLazyLoad
            // The height is just a placeholder
            // we use the minimum height of a cell
            // to estimate
            height={placeholderHeight}
            offset={300}
            overflow
            placeholder={<Loading height={placeholderHeight} />}
            throttle={500}
        >
            {children}
        </ReactLazyLoad>
    );
    const anchorName = getAnchorNameForCell(cellKey);
    // @ts-ignore
    const anchorTag = <a name={anchorName} id={anchorName} />;
    // Seems like there is an issue with react-lazyload's typescript
    // definition so we have to wrap children with <>
    return (
        <div ref={selfRef}>
            {anchorTag}
            {lazyDOM}
        </div>
    );
};
