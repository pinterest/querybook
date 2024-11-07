import React from 'react';

import { ILintSummary } from 'hooks/queryEditor/useLint';
import { formatNumber } from 'lib/utils/number';
import { Icon } from 'ui/Icon/Icon';

export const StatusBar = ({
    isLinting,
    lintSummary,
}: {
    isLinting: boolean;
    lintSummary: ILintSummary;
}) => {
    if (isLinting) {
        return (
            <span className="flex-row mr8">
                <Icon name="Loading" className="mr4" size={16} />
                Linting
            </span>
        );
    }

    if (lintSummary.numErrors + lintSummary.numWarnings > 0) {
        return (
            <div
                className="flex-row mr4"
                title={`${formatNumber(
                    lintSummary.numErrors,
                    'error'
                )}, ${formatNumber(lintSummary.numWarnings, 'warning')}`}
            >
                {lintSummary.numErrors > 0 && (
                    <span className="lint-num-errors flex-row mr4">
                        <Icon name="XOctagon" className="mr4" size={16} />
                        {lintSummary.numErrors}
                    </span>
                )}
                {lintSummary.numWarnings > 0 && (
                    <span className="lint-num-warnings flex-row mr8">
                        <Icon name="AlertTriangle" className="mr4" size={16} />
                        {lintSummary.numWarnings}
                    </span>
                )}
            </div>
        );
    } else if (lintSummary.failedToLint) {
        return (
            <span className="flex-row mr8 lint-num-warnings">
                <Icon name="AlertTriangle" className="mr4" size={16} />
                Linter is having issues
            </span>
        );
    } else {
        return (
            <span className="flex-row mr8 lint-passed">
                <Icon name="CheckCircle" className="mr4" size={16} />
                Lint Passed
            </span>
        );
    }
};
