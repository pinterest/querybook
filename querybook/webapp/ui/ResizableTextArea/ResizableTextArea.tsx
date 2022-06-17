import clsx from 'clsx';
import { throttle } from 'lodash';
import React, { useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';

import { useResizeObserver } from 'hooks/useResizeObserver';

export interface IResizableTextareaProps
    extends Omit<
        React.TextareaHTMLAttributes<HTMLTextAreaElement>,
        'onChange'
    > {
    value: string;
    className?: string;
    transparent?: boolean;
    disabled?: boolean;
    autoResize?: boolean;
    rows?: number;

    onChange: (value: string) => any;
}

const StyledTextarea = styled.textarea`
    color: inherit;
    border-radius: var(--border-radius-sm);
    display: block;
    max-width: 100%;
    min-width: 100%;
    resize: vertical;
    font-size: inherit;
    color: inherit;
    padding: 8px;

    ${({ transparent }) =>
        transparent &&
        `
        background-color: transparent !important;
        resize: none;
        border: none;
        outline: none;
    `};

    &:disabled {
        cursor: default;
        color: unset;
    }
`;

export const ResizableTextArea: React.FC<IResizableTextareaProps> = ({
    value = '',
    className = '',
    transparent = false,
    disabled = false,
    autoResize = true,
    rows = 1,
    onChange,

    ...textareaProps
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>();
    const autoHeight = useCallback(
        throttle(() => {
            if (textareaRef.current && autoResize) {
                const textarea = textareaRef.current;
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            }
        }, 500),
        [autoResize]
    );

    useEffect(() => {
        autoHeight();
    }, [value, autoResize]);

    useResizeObserver(textareaRef.current, autoHeight);

    const handleChange = useCallback(
        (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange(evt.target.value);
        },
        [onChange]
    );

    return (
        <StyledTextarea
            className={clsx({
                ResizableTextArea: true,
                [className]: Boolean(className),
            })}
            rows={rows}
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onInput={autoHeight}
            disabled={disabled}
            transparent={transparent}
            {...textareaProps}
        />
    );
};
