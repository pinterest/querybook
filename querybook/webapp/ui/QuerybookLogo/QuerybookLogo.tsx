import React from 'react';
import styled from 'styled-components';

import { getAppName } from 'lib/utils/global';

const StyledQuerybookLogo = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;

    font-size: ${({ size }) => `${size}rem`};
    .querybook-brandmark {
        width: ${({ size }) => `${size * 1.3}rem`};
        height: ${({ size }) => `${size * 1.3}rem`};
    }

    .querybook-wordmark {
        font-weight: 700;

        letter-spacing: -0.05em;
        padding-right: 0.05em;

        user-select: none;
        color: var(--color-accent-dark);
    }
`;

export const QuerybookLogo: React.FC<{
    size?: number;
    withBrandMark?: boolean;
}> = ({ size = 2, withBrandMark }) => (
    <StyledQuerybookLogo size={size}>
        {withBrandMark && (
            <img
                className="querybook-brandmark"
                src={'/static/favicon/querybook.svg'}
            />
        )}
        <span className="querybook-wordmark">{getAppName()}</span>
    </StyledQuerybookLogo>
);
