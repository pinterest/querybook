import { DEFAULT_NOTIFICATION_TIMEOUT } from 'components/NotificationManager/NotificationManager';
import { IConfirmationMessageProps } from 'components/ConfirmationManager/ConfirmationMessage';

import { reduxStore } from 'redux/store';
import * as globalUIActions from 'redux/globalUI/action';
import { Dispatch } from 'redux/store/types';
import { INotificationInfo } from 'redux/globalUI/types';

export function sendConfirm(props: IConfirmationMessageProps) {
    (reduxStore.dispatch as Dispatch)(globalUIActions.setConfirmation(props));
}

export function sendAlert({
    onDismiss,
    header,
    message,
}: {
    onDismiss?: () => any;
    header?: string;
    message?: string;
}) {
    const confirmProps: IConfirmationMessageProps = {};

    if (onDismiss) {
        confirmProps.onConfirm = onDismiss;
    }

    if (header) {
        confirmProps.header = header;
    }

    if (message) {
        confirmProps.message = message;
    }

    return sendConfirm(confirmProps);
}

export function sendNotification(
    content: React.ReactNode,
    options?: Partial<INotificationInfo>
) {
    (reduxStore.dispatch as Dispatch)(
        globalUIActions.pushNotification({
            timeout: DEFAULT_NOTIFICATION_TIMEOUT,
            ...options,
            content,
        })
    );
}

export function setupOnWebPageClose() {
    window.addEventListener('beforeunload', (e) => {
        const state = reduxStore.getState();
        const { dataDocSavePromiseById } = state.dataDoc;
        const hasUnsavedChanges = Object.values(dataDocSavePromiseById).some(
            (savePromise) => Object.keys(savePromise.itemToSave).length > 0
        );

        if (!hasUnsavedChanges) {
            return undefined;
        }

        const confirmationMessage = `
            It looks like DataDoc is still saving.
            If you leave before saving, your changes will be lost.
        `;

        (e || window.event).returnValue = confirmationMessage; // Gecko + IE
        return confirmationMessage; // Gecko + Webkit, Safari, Chrome etc.
    });
}

export function setSidebarTableId(tableId: number) {
    (reduxStore.dispatch as Dispatch)(
        globalUIActions.setSidebarTableId(tableId)
    );
}

export function setSessionExpired() {
    (reduxStore.dispatch as Dispatch)(globalUIActions.setSessionExpired());
}

export function setBrowserTitle(title = '', withSuffix = true) {
    const formattedTitle = withSuffix
        ? title
            ? title + ' - DataHub'
            : 'DataHub'
        : title;
    if (document.title !== formattedTitle) {
        document.title = formattedTitle;
    }
}
