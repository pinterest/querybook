import React from 'react';
import styled from 'styled-components';

import { Icon } from 'ui/Icon/Icon';
import { Title } from 'ui/Title/Title';

export interface ILoadingProps {
    useSpinner?: boolean;
    text?: string;
    className?: string;

    fullHeight?: boolean;
    height?: number;
}

const StyledLoading = styled.div`
    position: relative;
    overflow: hidden;
    display: block;
    min-width: 100px;
    min-height: ${(props) => `${props.height ?? 240}px`};
    height: ${(props) => `${props.height ?? 360}px`};

    ${({ fullHeight }) =>
        fullHeight &&
        `
        height: 100%;
    `};

    > div {
        height: 100%;
    }
`;

const StyledLoadingText = styled.div`
    position: relative;
    text-align: center;
`;

export const LoadingIcon: React.FC<{ className?: string }> = ({
    className = '',
}) => (
    <div className="flex-center">
        <Icon name="Loading" className={'p8' + className} color="light" />
    </div>
);

export const LoadingRow: React.FC = () => (
    <div className="center-align mv4">
        <LoadingIcon />
    </div>
);

export const Loading: React.FunctionComponent<ILoadingProps> = ({
    useSpinner = true,
    text = '',
    className = '',
    height,
    fullHeight,
}) => {
    const loadingIcon = useSpinner ? <LoadingIcon /> : null;

    const loadingText =
        (text || '').length > 0 ? (
            <StyledLoadingText>
                <Title size="xxxlarge" color="light">
                    {text}
                </Title>
            </StyledLoadingText>
        ) : null;

    return (
        <StyledLoading
            className={'Loading flex-center ' + className}
            height={height}
            fullHeight={fullHeight}
        >
            {loadingIcon}
            {loadingText}
        </StyledLoading>
    );
};
