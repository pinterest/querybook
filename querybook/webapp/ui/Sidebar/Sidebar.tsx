import Resizable, { ResizableProps } from 're-resizable';
import React from 'react';
import styled from 'styled-components';

import { enableResizable } from 'lib/utils';
import { FullHeight } from 'ui/FullHeight/FullHeight';

export interface ISidebarProps extends ResizableProps {
    initialWidth?: number | string;
    maxWidth?: number | string;
    minWidth?: number | string;

    right?: boolean;
    left?: boolean;

    className?: string;
}

const StyledSidebar = styled.div.attrs({
    className: 'Sidebar',
})`
    position: relative;

    ${({ left, right, isVisible }) => {
        if (!left && !right) {
            return '';
        }

        const side = left ? 'left' : 'right';
        const otherSide = left ? 'right' : 'left';

        const button = `
            .toggle-button {
                border-top-${side}-radius: 0px;
                border-bottom-${side}-radius: 0px;
                ${otherSide}: -39px;

                i {
                    left: ${left ? -3 : 3}px;
                }
            }
        `;

        const visible = !isVisible
            ? `
            .sidebar-content {
                display: none;
            }
        `
            : '';

        return button + visible;
    }};
`;

export const Sidebar: React.FunctionComponent<ISidebarProps> = ({
    children,
    initialWidth = 250,
    right = false,
    left = true,
    className = '',

    ...resizableProps
}) => (
    <StyledSidebar
        isVisible={true}
        left={left}
        right={right}
        className={className}
    >
        <FullHeight className="sidebar-content">
            <Resizable
                defaultSize={{
                    width: `${initialWidth}px`,
                    height: '100%',
                }}
                enable={enableResizable({ right: left, left: right })}
                {...resizableProps}
            >
                <FullHeight>{children}</FullHeight>
            </Resizable>
        </FullHeight>
    </StyledSidebar>
);
