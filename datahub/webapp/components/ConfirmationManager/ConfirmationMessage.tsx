import React from 'react';
import { Button } from 'ui/Button/Button';
import { Modal } from 'ui/Modal/Modal';
import './ConfirmationMessage.scss';

export interface IConfirmationMessageProps {
    header?: React.ReactChild;
    message?: React.ReactChild;

    // event when user clicks confirm
    onConfirm?: () => any;
    // events when user clicks cancel
    onDismiss?: () => any;
    // common events between confirm and cancel
    onHide?: () => any;

    // The hide dismiss makes confirmation modal a notification modal
    hideDismiss?: boolean;
}

export const ConfirmationMessage: React.FunctionComponent<IConfirmationMessageProps> = ({
    header = 'Are you sure?',
    message = '',
    onConfirm,
    onDismiss,
    onHide,
    hideDismiss,
}) => {
    const onCloseButtonClick = (confirm) => (evt) => {
        if (confirm && onConfirm) {
            onConfirm();
        }
        if (!confirm && onDismiss) {
            onDismiss();
        }
        if (onHide) {
            onHide();
        }
    };

    const actionButtons = [
        <Button
            onClick={onCloseButtonClick(false)}
            icon="x"
            title="Cancel"
            key="cancel"
            type="cancel"
        />,
        <Button
            type="confirm"
            onClick={onCloseButtonClick(true)}
            icon="check"
            title="Confirm"
            key="confirm"
        />,
    ];

    if (hideDismiss) {
        actionButtons.shift();
    }

    const actionsDOM = actionButtons.map((buttonDOM, index) => (
        <div key={index}>{buttonDOM}</div>
    ));

    return (
        <Modal
            onHide={onHide}
            hideClose={true}
            className="message-size with-padding"
        >
            <div className="ConfirmationMessage">
                <div className="confirmation-top">
                    <div className="confirmation-header">{header}</div>
                    <div className="confirmation-message">{message}</div>
                </div>
                <div className="confirmation-buttons flex-right">
                    {actionsDOM}
                </div>
            </div>
        </Modal>
    );
};
