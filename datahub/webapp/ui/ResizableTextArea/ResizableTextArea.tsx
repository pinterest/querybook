import classNames from 'classnames';
import { bind } from 'lodash-decorators';
import React, { useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';

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
    background-color: inherit;
    border-radius: var(--border-radius);
    border: var(--border);
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
        background: none;
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
    useEffect(() => {
        autoHeight();
    }, [value, autoResize]);

    const autoHeight = useCallback(() => {
        if (textareaRef.current && autoResize) {
            const textarea = textareaRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [autoResize]);

    const handleChange = useCallback(
        (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange(evt.target.value);
        },
        [onChange]
    );

    return (
        <StyledTextarea
            className={classNames({
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
