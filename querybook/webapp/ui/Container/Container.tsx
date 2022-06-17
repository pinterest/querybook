import React from 'react';

import { FullHeight, IFullHeightProps } from 'ui/FullHeight/FullHeight';

import './Container.scss';

export const Container: React.FC<
    React.HTMLProps<HTMLDivElement> & IFullHeightProps
> = ({ children, flex, ...props }) => (
    <div {...props} className={(props.className || '') + ' Container'}>
        <FullHeight flex={flex} className="Container-content">
            {children}
        </FullHeight>
    </div>
);
