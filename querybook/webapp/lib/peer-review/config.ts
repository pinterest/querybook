import { useMemo } from 'react';
import { PEER_REVIEW_CONFIG } from 'lib/public-config';
import { IPeerReviewTexts } from './types';

export interface IPeerReviewConfig {
    isEnabled: boolean;
    texts: IPeerReviewTexts;
}

export function usePeerReview(): IPeerReviewConfig {
    return useMemo(
        () => ({
            isEnabled: PEER_REVIEW_CONFIG.enabled,
            texts: {
                modal: {
                    description: PEER_REVIEW_CONFIG.texts.modal.description,
                    guideLink: PEER_REVIEW_CONFIG.texts.modal.guide_link,
                    reviewTip: PEER_REVIEW_CONFIG.texts.modal.tip,
                },
            },
        }),
        []
    );
}
