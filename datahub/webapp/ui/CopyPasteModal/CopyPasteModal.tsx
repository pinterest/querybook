import React from 'react';
import { CopyButton } from 'ui/CopyButton/CopyButton';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';
import { Modal } from 'ui/Modal/Modal';

import './CopyPasteModal.scss';

interface IProps {
    text: string;
    displayText?: boolean;
    onHide: () => any;
}

export const CopyPasteModal: React.FunctionComponent<IProps> = (props) => {
    const { text, onHide, displayText = true } = props;

    const actionsDOM = [
        <CopyButton key="copy" copyText={text} title="Copy To Clipboard" />,
    ];

    const textDOM = displayText ? (
        <blockquote className="CopyPasteModal-text">
            <pre>
                <ShowMoreText text={text} length={400} />
            </pre>
        </blockquote>
    ) : null;

    return (
        <Modal onHide={onHide} title="Copy Paste Modal">
            <div className="CopyPasteModal">
                <div>
                    <div>{textDOM}</div>
                </div>
                <div className="right-align">{actionsDOM}</div>
            </div>
        </Modal>
    );
};
