import React from 'react';
import { Button } from 'ui/Button/Button';

interface IProps {
    suggestionText: string;
    onAcceptSuggestion: () => void;
    onCancel: () => void;
}

const SUGGESTION_MAX_LENGTH = 20;

export const SuggestionTooltip: React.FunctionComponent<IProps> = ({
    suggestionText,
    onAcceptSuggestion,
    onCancel,
}) => {
    const truncatedSuggestion =
        suggestionText.length > SUGGESTION_MAX_LENGTH
            ? suggestionText.slice(0, 20) + '...'
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
                <Button
                    title="Cancel"
                    onClick={onCancel}
                    theme="fill"
                    color="cancel"
                    icon="X"
                />
            </div>
        </div>
    );
};
