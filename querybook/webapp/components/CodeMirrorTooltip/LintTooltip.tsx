import React, { useCallback, useMemo } from 'react';

import { Button } from 'ui/Button/Button';

interface IProps {
    message: string;
    suggestion?: string;
    onAcceptSuggestion?: (suggestion: string) => void;
}

const SUGGESTION_MAX_LENGTH = 40;

export const LintTooltip: React.FunctionComponent<IProps> = ({
    message,
    suggestion,
    onAcceptSuggestion,
}) => {
    const truncatedSuggestion = useMemo(
        () =>
            suggestion && suggestion.length > SUGGESTION_MAX_LENGTH
                ? suggestion.slice(0, SUGGESTION_MAX_LENGTH - 3) + '...'
                : suggestion,
        [suggestion]
    );

    const onClick = useCallback(() => {
        onAcceptSuggestion(suggestion);
    }, [onAcceptSuggestion, suggestion]);

    return (
        <div className="rich-text-content">
            <div>{message}</div>
            {truncatedSuggestion && (
                <div className="mt8">
                    <div>
                        Replace with <code>{truncatedSuggestion}</code>
                    </div>
                    <div className="mt8 right-align">
                        <Button
                            title="Accept"
                            onClick={onClick}
                            theme="fill"
                            color="confirm"
                            icon="Check"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
