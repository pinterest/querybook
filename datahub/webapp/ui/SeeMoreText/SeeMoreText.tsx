import React from 'react';

interface ISeeMoreTextProps {
    text: string;
    length?: number;
    seeLess?: boolean;
}

export const SeeMoreText: React.FunctionComponent<ISeeMoreTextProps> = ({
    text,
    length = 100,
    seeLess = false,
}) => {
    text = text || '';

    const [expanded, setExpanded] = React.useState(false);
    const toggleSeeMoreClick = (e: React.SyntheticEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setExpanded(!expanded);
    };

    if (text.length === 0) {
        return null;
    } else if (text.length >= length) {
        // exceeding length requirement
        if (!expanded) {
            return (
                <span className="SeeMoreText">
                    {text.slice(0, length)}{' '}
                    <a onClick={toggleSeeMoreClick}>...See More</a>
                </span>
            );
        } else {
            const seeLessSection = seeLess ? (
                <>
                    {' '}
                    <a onClick={toggleSeeMoreClick}>...See Less</a>
                </>
            ) : null;

            return (
                <span className="SeeMoreText">
                    {text}
                    {seeLessSection}
                </span>
            );
        }
    }

    // normal case, text within the number of chars
    return <span className="SeeMoreText">{text}</span>;
};
