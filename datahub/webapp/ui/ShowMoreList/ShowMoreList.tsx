import React, { useMemo } from 'react';

import './ShowMoreList.scss';

interface IShowMoreListProps {
    list: string[];
    length?: number;
    seeLess?: boolean;
    className?: string;
}

export const ShowMoreList: React.FunctionComponent<IShowMoreListProps> = ({
    list,
    length = 3,
    seeLess = false,
    className = '',
}) => {
    const combinedClassName = useMemo(() => `ShowMoreList ${className}`, [
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

    if (list?.length === 0) {
        return null;
    } else if (list.length >= length) {
        // exceeding length requirement
        if (!expanded) {
            return (
                <span className={combinedClassName}>
                    {list.slice(0, length).map((line, idx) => (
                        <span key={idx}>{line}</span>
                    ))}
                    <span
                        className="ShowMoreList-click"
                        onClick={toggleSeeMoreClick}
                    >
                        show more
                    </span>
                </span>
            );
        } else {
            const seeLessSection = seeLess ? (
                <span
                    className="ShowMoreList-click"
                    onClick={toggleSeeMoreClick}
                >
                    show less
                </span>
            ) : null;

            return (
                <span className={combinedClassName}>
                    {list.map((line, idx) => (
                        <span key={idx}>{line}</span>
                    ))}
                    {seeLessSection}
                </span>
            );
        }
    }

    // normal case, list within the number of chars
    return <span className={combinedClassName}>{list}</span>;
};
