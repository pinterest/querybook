import React, { useMemo } from 'react';

interface ISeeMoreTextProps {
    text: string;
    length?: number;
    seeLess?: boolean;
    className?: string;
}

export const SeeMoreText: React.FunctionComponent<ISeeMoreTextProps> = ({
    text,
    length = 100,
    seeLess = false,
    className = '',
}) => {
    text = text || '';
    const combinedClassName = useMemo(() => `SeeMoreText ${className}`, [
        className,
    ]);

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
                <span className={combinedClassName}>
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
                <span className={combinedClassName}>
                    {text}
                    {seeLessSection}
                </span>
            );
        }
    }

    // normal case, text within the number of chars
    return <span className={combinedClassName}>{text}</span>;
};
