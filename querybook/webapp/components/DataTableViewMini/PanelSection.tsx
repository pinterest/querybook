import { titleize } from 'lib/utils';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Icon } from 'ui/Icon/Icon';
import { AccentText } from 'ui/StyledText/StyledText';

export interface IPanelSectionProps {
    title: string;
    hideIfNoContent?: boolean;
}

const PanelContentWrapper = styled.div`
    margin-left: 16px;
    margin-bottom: 4px;
    word-break: break-all;

    ${({ isOpen }) =>
        isOpen
            ? ''
            : `
        display: none;
    `};
`;

const PanelTitle = styled.span`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    cursor: pointer;
    margin-left: 8px;
    margin-bottom: 4px;
    padding: 4px 8px;

    background-color: var(--bg-light);
    border-radius: var(--border-radius-sm);
`;

export const PanelSection: React.FunctionComponent<IPanelSectionProps> = ({
    title,
    children,
    hideIfNoContent,
}) => {
    const [isOpen, setIsOpen] = React.useState(true);
    const toggleSectionOpen = useCallback(() => {
        setIsOpen((o) => !o);
    }, []);

    if (hideIfNoContent && !children) {
        return null;
    }

    const headerDOM = (
        <div onClick={toggleSectionOpen}>
            <PanelTitle>
                <AccentText
                    noUserSelect
                    size="text"
                    weight="bold"
                    color="light"
                >
                    {titleize(title)}
                </AccentText>
                <Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} />
            </PanelTitle>
        </div>
    );
    return (
        <div className="mb8">
            {headerDOM}
            <PanelContentWrapper isOpen={isOpen}>
                {children}
            </PanelContentWrapper>
        </div>
    );
};

const StyledSubPanelSection = styled.div`
    margin-bottom: 12px;
`;

const SubPanelTitle = styled.p`
    user-select: none;

    font-size: var(--text-size);
    color: var(--text-light);
`;

const SubPanelValue = styled.p`
    font-size: var(--small-text-size);
`;

export const SubPanelSection: React.FunctionComponent<{
    title: string;
    hideIfNoContent?: boolean;
}> = ({ title, children, hideIfNoContent }) =>
    hideIfNoContent && !children ? null : (
        <StyledSubPanelSection>
            <SubPanelTitle>{title}</SubPanelTitle>
            <SubPanelValue>{children}</SubPanelValue>
        </StyledSubPanelSection>
    );
