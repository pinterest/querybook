import React, { useMemo } from 'react';

import './ShowMoreText.scss';

interface IShowMoreTextProps {
    text: string;
    length?: number;
    seeLess?: boolean;
    className?: string;
    nextLine?: boolean;
}

export const ShowMoreText: React.FunctionComponent<IShowMoreTextProps> = ({
    text,
    length = 100,
    seeLess = false,
    className = '',
    nextLine = false,
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
    } else if (text.length >= length) {
        // exceeding length requirement
        if (!expanded) {
            return (
                <span className={combinedClassName}>
                    {text.slice(0, length)}
                    <div
                        className={
                            nextLine
                                ? 'ShowMoreText-click next-line'
                                : 'ShowMoreText-click'
                        }
                        onClick={toggleSeeMoreClick}
                    >
                        show more
                    </div>
                </span>
            );
        } else {
            const seeLessSection = seeLess ? (
                nextLine ? (
                    <div
                        className="ShowMoreText-click"
                        onClick={toggleSeeMoreClick}
                    >
                        show less
                    </div>
                ) : (
                    <a
                        className="ShowMoreText-click"
                        onClick={toggleSeeMoreClick}
                    >
                        show less
                    </a>
                )
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
