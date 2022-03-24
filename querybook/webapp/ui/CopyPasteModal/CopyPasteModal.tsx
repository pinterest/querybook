import React from 'react';
import { CopyButton } from 'ui/CopyButton/CopyButton';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';
import { Modal } from 'ui/Modal/Modal';

import './CopyPasteModal.scss';

interface IProps {
    text: string;
    displayText?: boolean;
    title?: string;
    onHide: () => any;
}

export const CopyPasteModal: React.FunctionComponent<IProps> = (props) => {
    const { text, onHide, displayText = true, title } = props;

    const actionsDOM = [
        <CopyButton key="copy" copyText={text} title="Copy To Clipboard" />,
    ];

    const textDOM = displayText ? (
        <blockquote className="CopyPasteModal-text mb16">
            <pre>
                <ShowMoreText text={text} length={400} />
            </pre>
        </blockquote>
    ) : null;

    return (
        <Modal onHide={onHide} title={title ?? 'Copy Paste'}>
            <div className="CopyPasteModal">
                <div>
                    <div>{textDOM}</div>
                </div>
                <div className="right-align mt24">{actionsDOM}</div>
            </div>
        </Modal>
    );
};
