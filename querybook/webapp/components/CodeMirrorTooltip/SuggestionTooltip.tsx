import React, { useCallback, useMemo } from 'react';
import { Button } from 'ui/Button/Button';

interface IProps {
    suggestionText: string;
    onAcceptSuggestion: (suggestion: string) => void;
}

const SUGGESTION_MAX_LENGTH = 20;

export const SuggestionTooltip: React.FunctionComponent<IProps> = ({
    suggestionText,
    onAcceptSuggestion,
}) => {
    const truncatedSuggestion = useMemo(
        () =>
            suggestionText.length > SUGGESTION_MAX_LENGTH
                ? suggestionText.slice(0, SUGGESTION_MAX_LENGTH - 3) + '...'
                : suggestionText,
        [suggestionText]
    );

    const onClick = useCallback(() => {
        onAcceptSuggestion(suggestionText);
    }, [onAcceptSuggestion, suggestionText]);

    return (
        <div className="rich-text-content">
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
    );
};
