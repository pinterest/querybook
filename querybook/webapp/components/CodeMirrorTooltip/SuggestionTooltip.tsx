import React from 'react';
import { Button } from 'ui/Button/Button';

interface IProps {
    suggestionText: string;
    onAcceptSuggestion: () => void;
}

const SUGGESTION_MAX_LENGTH = 20;

export const SuggestionTooltip: React.FunctionComponent<IProps> = ({
    suggestionText,
    onAcceptSuggestion,
}) => {
    const truncatedSuggestion =
        suggestionText.length > SUGGESTION_MAX_LENGTH
            ? suggestionText.slice(0, SUGGESTION_MAX_LENGTH) + '...'
            : suggestionText;

    return (
        <div className="rich-text-content">
            <div>
                Replace with <code>{truncatedSuggestion}</code>
            </div>
            <div className="mt8 right-align">
                <Button
                    title="Accept"
                    onClick={onAcceptSuggestion}
                    theme="fill"
                    color="confirm"
                    icon="Check"
                />
            </div>
        </div>
    );
};
