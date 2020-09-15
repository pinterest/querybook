import React, { useMemo } from 'react';

import './ShowMoreText.scss';

interface IShowMoreTextProps {
    text: string;
    length?: number;
    seeLess?: boolean;
    className?: string;
}

export const ShowMoreText: React.FunctionComponent<IShowMoreTextProps> = ({
    text,
    length = 100,
    seeLess = false,
    className = '',
}) => {
    text = text || '';
    const combinedClassName = useMemo(() => `ShowMoreText ${className}`, [
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
    } else if (text.length >= length && !expanded) {
        // exceeding length requirement
        return (
            <span className={combinedClassName}>
                {text.slice(0, length)}
                <span
                    className="ShowMoreText-click"
                    onClick={toggleSeeMoreClick}
                >
                    show more
                </span>
            </span>
        );
    } else {
        // normal case, text within the number of chars
        const seeLessSection =
            text.length >= length && seeLess ? (
                <span
                    className="ShowMoreText-click"
                    onClick={toggleSeeMoreClick}
                >
                    show less
                </span>
            ) : null;

        return (
            <span className={combinedClassName}>
                {text}
                {seeLessSection}
            </span>
        );
    }
};
