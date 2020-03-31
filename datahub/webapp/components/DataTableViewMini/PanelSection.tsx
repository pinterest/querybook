import React from 'react';
import styled from 'styled-components';

export interface IPanelSectionProps {
    title: string;
}
export interface IPanelSectionState {
    isOpen: boolean;
}

const PanelContentWrapper = styled.div`
    padding: 5px 32px;
    word-break: break-all;

    ${({ isOpen }) =>
        isOpen
            ? ''
            : `
        display: none;
    `};
`;

const PanelTitle = styled.p`
    cursor: pointer;
    padding: 5px 10px;
    text-transform: uppercase;
    user-select: none;

    font-size: var(--med-text-size);
    font-weight: bold;
`;

export const PanelSection: React.FunctionComponent<IPanelSectionProps> = ({
    title,
    children,
}) => {
    const [isOpen, setIsOpen] = React.useState(true);

    const toggleSectionOpen = () => {
        setIsOpen(!isOpen);
    };

    const headerDOM = (
        <div onClick={toggleSectionOpen}>
            <PanelTitle>
                <span>
                    <i
                        className={'fa fa-angle-' + (isOpen ? 'down' : 'right')}
                    />
                    &nbsp;&nbsp;
                </span>
                {title}
            </PanelTitle>
        </div>
    );
    return (
        <div>
            {headerDOM}
            <PanelContentWrapper isOpen={isOpen}>
                {children}
            </PanelContentWrapper>
        </div>
    );
};

const SubPanelTitle = styled.p`
    text-transform: uppercase;
    user-select: none;

    font-size: var(--text-size);
    color: var(--light-text-color);
`;

const StyledSubPanelSection = styled.div`
    margin-bottom: 10px;
`;

export const SubPanelSection: React.FunctionComponent<{
    title: string;
}> = ({ title, children }) => {
    return (
        <StyledSubPanelSection>
            <div>
                <SubPanelTitle className="subtitle is-6">{title}</SubPanelTitle>
            </div>
            <div>{children}</div>
        </StyledSubPanelSection>
    );
};
