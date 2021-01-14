import React from 'react';
import styled from 'styled-components';
import { Title } from 'ui/Title/Title';

export interface ILoadingProps {
    useSpinner?: boolean;
    text?: string;
    className?: string;

    height?: number;
}

const StyledLoading = styled.div`
    position: relative;
    overflow: hidden;
    display: block;
    min-width: 100px;
    min-height: ${(props) => `${props.height ?? 200}px`};
    height: ${(props) => `${props.height ?? 330}px`};
`;

const StyledSpinner = styled.div`
    position: relative;
    top: 50%;
    transform: translateY(-50%);
    margin: auto;
    width: 20px;
    height: 20px;
    font-size: var(--large-text-size);
    color: var(--icon-color);
`;

const StyledLoadingText = styled.div`
    position: relative;
    text-align: center;
`;

export const LoadingIcon: React.FC = () => (
    <StyledSpinner>
        <i className="fa fa-spinner fa-pulse" />
    </StyledSpinner>
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
}) => {
    const loadingIcon = useSpinner ? <LoadingIcon /> : null;

    const loadingText =
        (text || '').length > 0 ? (
            <StyledLoadingText>
                <Title size={1}>{text}</Title>
            </StyledLoadingText>
        ) : null;

    return (
        <StyledLoading className={className} height={height}>
            {loadingIcon}
            {loadingText}
        </StyledLoading>
    );
};
