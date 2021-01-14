import React from 'react';
import styled from 'styled-components';

const StyledQuerybookLogo = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;

    .querybook-brandmark {
        width: ${({ size }) => `${size * 1.3}rem`};
        height: ${({ size }) => `${size * 1.3}rem`};
    }

    .querybook-wordmark {
        align-items: center;
        font-size: ${({ size }) => `${size}rem`};
        font-weight: 700;
        letter-spacing: -0.05em;
        padding: 0px;
        user-select: none;

        .querybook-title-first-part {
            color: var(--color-red);
        }

        .querybook-title-last-part {
            color: var(--color-blue);
            position: relative;
            left: -0.18em;
            mix-blend-mode: var(--mix-blend-mode);
        }
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
                src={'/static/favicon/favicon.ico'}
            />
        )}
        <span className="querybook-wordmark">
            <span className="querybook-title-first-part">Query</span>
            <span className="querybook-title-last-part">book</span>
        </span>
    </StyledQuerybookLogo>
);
