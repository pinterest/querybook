import React from 'react';
import { FullHeight, IFullHeightProps } from 'ui/FullHeight/FullHeight';

import './Container.scss';

export const Container: React.FC<
    React.HTMLAttributes<HTMLDivElement> & IFullHeightProps
> = ({ children, flex, ...props }) => {
    return (
        <div {...props} className={(props.className || '') + ' Container'}>
            <FullHeight flex={flex} className="Container-content">
                {children}
            </FullHeight>
        </div>
    );
};
