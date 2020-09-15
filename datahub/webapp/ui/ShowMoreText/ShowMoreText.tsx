import React, { useMemo } from 'react';
import classNames from 'classnames';

import './ShowMoreText.scss';

interface IShowMoreTextProps {
    text: string | string[];
    length?: number;
    count?: number;
    seeLess?: boolean;
    className?: string;
}

export const ShowMoreText: React.FunctionComponent<IShowMoreTextProps> = ({
    text = '',
    length = 100,
    count = 4,
    seeLess = false,
    className = '',
}) => {
    const [expanded, setExpanded] = React.useState(false);
    const { isList, max } = useMemo(
        () =>
            Array.isArray(text)
                ? { isList: true, max: count }
                : { isList: false, max: length },
        [text, count, length]
    );
    console.log('Array.isArray(text)', Array.isArray(text), max);

    const toggleSeeMoreClick = (e: React.SyntheticEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setExpanded(!expanded);
    };

    const combinedClassName = classNames({
        ShowMoreText: true,
        [className]: className,
        'is-list': isList,
    });

    if (text.length === 0) {
        return null;
    } else if (text.length >= max && !expanded) {
        // exceeding length requirement
        return (
            <span className={combinedClassName}>
                {isList
                    ? text
                          .slice(0, max)
                          .map((line, idx) => <span key={idx}>{line}</span>)
                    : text.slice(0, max)}
                <span
                    className="ShowMoreText-click"
                    onClick={toggleSeeMoreClick}
                >
                    show more
                </span>
            </span>
        );
    } else {
        // normal case, text within the max
        const seeLessSection =
            text.length >= max && seeLess ? (
                <span
                    className="ShowMoreText-click"
                    onClick={toggleSeeMoreClick}
                >
                    show less
                </span>
            ) : null;

        return (
            <span className={combinedClassName}>
                {isList
                    ? text.map((line, idx) => <span key={idx}>{line}</span>)
                    : text}
                {seeLessSection}
            </span>
        );
    }
};
