import { useMemo } from 'react';
import { PEER_REVIEW_CONFIG } from 'lib/public-config';

export interface IPeerReviewConfig {
    isEnabled: boolean;
    requestTexts: {
        description: string;
        guideLink: string;
        reviewTip: string;
    };
    reviewerTexts: {
        approveMessage: string;
    };
}

export function usePeerReview(): IPeerReviewConfig {
    return useMemo(
        () => ({
            isEnabled: PEER_REVIEW_CONFIG.enabled,
            requestTexts: {
                description: PEER_REVIEW_CONFIG.request_texts.description,
                guideLink: PEER_REVIEW_CONFIG.request_texts.guide_link,
                reviewTip: PEER_REVIEW_CONFIG.request_texts.tip,
            },
            reviewerTexts: {
                approveMessage:
                    PEER_REVIEW_CONFIG.reviewer_texts.approve_message,
            },
        }),
        []
    );
}
