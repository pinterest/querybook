import React from 'react';
import styled, { css } from 'styled-components';

import { IconButton } from 'ui/Button/IconButton';

export interface IStarRatingProps {
    rating?: number;
    onChange: (rating: number) => any;
    size?: number;
}

const StyledRatingEmpty = css`
    color: var(--text-lightest);
    .Icon {
        svg {
            fill: transparent;
        }
    }
`;
const StyledRatingFilled = css`
    color: var(--color-yellow);
    .Icon {
        svg {
            fill: var(--color-yellow);
        }
    }
`;

const StyledRating = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    .IconButton {
        ${StyledRatingEmpty}

        &.star-selected {
            ${StyledRatingFilled}
        }
        margin-right: 2px;

        transition: scale 0.2s ease-in-out;

        &:hover {
            scale: 1.2;

            & ~ .IconButton {
                ${StyledRatingEmpty}
            }
        }

        &:has(~ .IconButton:hover),
        &:hover {
            ${StyledRatingFilled}
        }
    }
`;

const STARS = [1, 2, 3, 4, 5];

export const StarRating: React.FC<IStarRatingProps> = ({
    rating,
    onChange,
    size,
}) => {
    const uptoStar = rating || 0;
    return (
        <StyledRating>
            {STARS.map((star) => (
                <IconButton
                    key={star}
                    noPadding
                    size={size ?? 16}
                    icon="Star"
                    fill={star <= uptoStar}
                    onClick={() => onChange(star)}
                    className={star <= uptoStar ? 'star-selected' : ''}
                />
            ))}
        </StyledRating>
    );
};
