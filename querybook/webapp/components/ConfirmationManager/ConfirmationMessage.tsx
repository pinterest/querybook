import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useEvent } from 'hooks/useEvent';
import { KeyMap, matchKeyMap } from 'lib/utils/keyboard';
import { Button } from 'ui/Button/Button';
import { ButtonColorType } from 'ui/Button/ButtonTheme';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { Modal } from 'ui/Modal/Modal';

import './ConfirmationMessage.scss';

export interface IConfirmationMessageProps {
    header?: string;
    message?: React.ReactChild;

    // event when user clicks confirm
    onConfirm?: () => any;
    // events when user clicks cancel
    onDismiss?: () => any;
    // common events between confirm and cancel
    onHide?: () => any;

    // The hide dismiss makes confirmation modal a notification modal
    hideDismiss?: boolean;

    confirmColor?: ButtonColorType;
    cancelColor?: ButtonColorType;

    confirmIcon?: AllLucideIconNames;
    cancelIcon?: AllLucideIconNames;

    confirmText?: string;
    cancelText?: string;
}

export const ConfirmationMessage: React.FunctionComponent<
    IConfirmationMessageProps
> = ({
    header = 'Are you sure?',
    message = '',
    onConfirm,
    onDismiss,
    onHide,
    hideDismiss,
    confirmColor = 'confirm',
    cancelColor = 'cancel',
    confirmIcon = 'Check',
    cancelIcon = 'X',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
}) => {
    const selfRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        selfRef.current.focus();
    }, []);

    const onCloseButtonClick = useCallback(
        (confirm) => () => {
            if (confirm && onConfirm) {
                onConfirm();
            }
            if (!confirm && onDismiss) {
                onDismiss();
            }
            if (onHide) {
                onHide();
            }
        },
        [onConfirm, onDismiss, onHide]
    );
    const handleConfirm = useMemo(
        () => onCloseButtonClick(true),
        [onCloseButtonClick]
    );
    const handleCancel = useMemo(
        () => onCloseButtonClick(false),
        [onCloseButtonClick]
    );

    const onEnterPress = useCallback(
        (evt: KeyboardEvent) => {
            if (matchKeyMap(evt, KeyMap.overallUI.confirmModal)) {
                onCloseButtonClick(true)();
            }
        },
        [onCloseButtonClick]
    );

    useEvent('keydown', onEnterPress);

    const actionButtons = [
        <Button
            key="cancel"
            onClick={handleCancel}
            icon={cancelIcon}
            title={cancelText}
            color={cancelColor}
        />,
        <Button
            key="confirm"
            onClick={handleConfirm}
            icon={confirmIcon}
            title={confirmText}
            color={confirmColor}
        />,
    ];

    if (hideDismiss) {
        actionButtons.shift();
    }

    return (
        <Modal onHide={handleCancel} className="message-size" title={header}>
            <div className="ConfirmationMessage" ref={selfRef} tabIndex={0}>
                <div className="confirmation-message">{message}</div>
                <div className="confirmation-buttons flex-right mt36">
                    {actionButtons}
                </div>
            </div>
        </Modal>
    );
};
