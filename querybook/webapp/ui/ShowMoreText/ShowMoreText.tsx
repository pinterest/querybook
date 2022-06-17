import clsx from 'clsx';
import React from 'react';

import './ShowMoreText.scss';

interface IShowMoreTextProps {
    text: string | string[];
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
    text = text ?? '';

    const [expanded, setExpanded] = React.useState(false);
    const isList = Array.isArray(text);
    const max = length ?? (isList ? 4 : 100);

    const toggleSeeMoreClick = (e: React.SyntheticEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setExpanded(!expanded);
    };

    const combinedClassName = clsx({
        ShowMoreText: true,
        [className]: className,
        'is-list': isList,
    });

    if (text.length === 0) {
        return null;
    } else if (text.length >= max && !expanded) {
        // exceeding length requirement
        const truncatedText = text.slice(0, max);
        return (
            <span className={combinedClassName}>
                {isList
                    ? (truncatedText as string[]).map((line, idx) => (
                          <span key={idx}>{line}</span>
                      ))
                    : truncatedText}
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
            seeLess && text.length >= max ? (
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
                    ? (text as string[]).map((line, idx) => (
                          <span key={idx}>{line}</span>
                      ))
                    : text}
                {seeLessSection}
            </span>
        );
    }
};
