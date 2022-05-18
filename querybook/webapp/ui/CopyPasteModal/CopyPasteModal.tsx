import React from 'react';
import { CopyButton } from 'ui/CopyButton/CopyButton';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';
import { Modal } from 'ui/Modal/Modal';

import './CopyPasteModal.scss';
import clsx from 'clsx';

interface IProps {
    text: string;
    displayText?: boolean;
    title?: string;
    onHide: () => any;
    large?: boolean;
}

export const CopyPasteModal: React.FunctionComponent<IProps> = ({
    text,
    onHide,
    displayText = true,
    title,
    large,
}) => {
    const actionsDOM = [
        <CopyButton key="copy" copyText={text} title="Copy To Clipboard" />,
    ];

    const textDOM = displayText ? (
        <blockquote className="CopyPasteModal-text mb16">
            <pre>
                {large ? text : <ShowMoreText text={text} length={400} />}
            </pre>
        </blockquote>
    ) : null;

    const className = clsx({
        CopyPasteModal: true,
        large,
    });

    return (
        <Modal onHide={onHide} title={title ?? 'Copy Paste'}>
            <div className={className}>
                <div>{textDOM}</div>
                <div className="right-align mt24">{actionsDOM}</div>
            </div>
        </Modal>
    );
};
