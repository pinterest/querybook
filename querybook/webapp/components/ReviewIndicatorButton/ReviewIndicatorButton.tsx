import React from 'react';
import clsx from 'clsx';
import { getButtonComponentByType } from 'ui/Button/Button';
import type { IQueryReview } from 'const/queryExecution';
import type { TooltipDirection } from 'const/tooltip';

interface IReviewIndicatorButtonProps {
    review: IQueryReview;
    onClick: () => void;
    tooltipPos?: TooltipDirection;
    className?: string;
}

const STATUS_CONFIG = {
    pending: {
        icon: 'Clock' as const,
        title: 'Pending Review',
    },
    approved: {
        icon: 'CheckCircle' as const,
        title: 'Review Approved',
    },
    rejected: {
        icon: 'XCircle' as const,
        title: 'Review Rejected',
    },
} as const;

export const ReviewIndicatorButton: React.FC<IReviewIndicatorButtonProps> = ({
    review,
    onClick,
    className = '',
}) => {
    const config = STATUS_CONFIG[review.status] || STATUS_CONFIG.pending;
    const Button = getButtonComponentByType('text');

    return (
        <Button
            size="small"
            icon={config.icon}
            title={config.title}
            aria-label={'Click to view details'}
            data-balloon-pos={'up'}
            onClick={onClick}
            color={'light'}
            theme="text"
            className={clsx('review-status-button', className)}
        />
    );
};
