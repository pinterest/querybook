import React from 'react';
import styled from 'styled-components';

const StyledDataHubLogo = styled.span`
    align-items: center;
    font-size: ${({ size }) => (size ? `${size}rem` : '2rem')};
    font-weight: 700;
    letter-spacing: -0.05em;
    padding: 0px;
    user-select: none;

    .datahub-title-first-part {
        color: var(--color-red);
    }

    .datahub-title-last-part {
        color: var(--color-blue);
        position: relative;
        left: -0.18em;
        mix-blend-mode: var(--mix-blend-mode);
    }
`;

export const DataHubLogo: React.SFC<{
    size?: number;
}> = ({ size = 2 }) => (
    <StyledDataHubLogo size={size}>
        <span className="datahub-title-first-part">Data</span>
        <span className="datahub-title-last-part">Hub</span>
    </StyledDataHubLogo>
);
