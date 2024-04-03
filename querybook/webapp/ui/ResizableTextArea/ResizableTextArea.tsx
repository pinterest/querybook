import clsx from 'clsx';
import { throttle } from 'lodash';
import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';
import styled from 'styled-components';

import { useResizeObserver } from 'hooks/useResizeObserver';

export interface IResizableTextareaHandles {
    focus: () => void;
}

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
    ref?: React.Ref<IResizableTextareaHandles>;

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

export const ResizableTextArea = forwardRef<
    IResizableTextareaHandles,
    IResizableTextareaProps
>(
    (
        {
            value = '',
            className = '',
            transparent = false,
            disabled = false,
            autoResize = true,
            rows = 1,
            onChange,

            ...textareaProps
        },
        ref
    ) => {
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

        useImperativeHandle(
            ref,
            () => ({
                focus: () => {
                    textareaRef.current?.focus();
                },
            }),
            []
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
    }
);
