import { ITag } from 'const/tag';
import { isEmpty, orderBy } from 'lodash';
import { useMemo } from 'react';

// This is the score if tag.meta.rank is defined
const BASELINE_TAG_RANK_SCORE = 2;

export function useRankedTags(tags: ITag[]) {
    // Note: orderBy is a stable sort, so the API order is kept
    return useMemo(
        () =>
            orderBy(
                tags,
                (tag) => {
                    if (tag.meta?.rank != null) {
                        return tag.meta.rank + BASELINE_TAG_RANK_SCORE;
                    } else if (!isEmpty(tag.meta)) {
                        return BASELINE_TAG_RANK_SCORE;
                    } else {
                        return 0;
                    }
                },
                ['desc']
            ),
        [tags]
    );
}
