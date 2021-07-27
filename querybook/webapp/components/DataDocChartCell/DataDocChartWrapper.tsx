import clsx from 'clsx';
import React from 'react';
import styled from 'styled-components';

import { ChartSize } from 'const/dataDocChart';
import { ErrorBoundary } from 'ui/ErrorBoundary/ErrorBoundary';

export interface IDataDocChartWrapper {
    size?: ChartSize;
    className?: string;
}

const StyledChartWrapper = styled.div<{ size: ChartSize }>`
    position: relative;
    ${(props) =>
        props.size === ChartSize.AUTO
            ? ''
            : `height: ${
                  props.size === ChartSize.SMALL
                      ? '30vh'
                      : props.size === ChartSize.MEDIUM
                      ? '60vh'
                      : '90vh'
              }`}
`;

export const DataDocChartWrapper: React.FC<IDataDocChartWrapper> = ({
    children,
    className,
    size,
}) => (
    <StyledChartWrapper
        className={clsx(className, 'DataDocChartWrapper')}
        size={size ?? ChartSize.AUTO}
    >
        <ErrorBoundary>{children}</ErrorBoundary>
    </StyledChartWrapper>
);
