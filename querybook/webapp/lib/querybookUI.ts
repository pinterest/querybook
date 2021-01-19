import { IConfirmationMessageProps } from 'components/ConfirmationManager/ConfirmationMessage';
import * as querybookUIActions from 'redux/querybookUI/action';
import { reduxStore } from 'redux/store';
import { Dispatch } from 'redux/store/types';
import { getAppName } from './utils/global';

export function sendConfirm(props: IConfirmationMessageProps) {
    (reduxStore.dispatch as Dispatch)(
        querybookUIActions.setConfirmation(props)
    );
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

export function setupOnQuerybookClose() {
    // This is
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
        querybookUIActions.setSidebarTableId(tableId)
    );
}

export function setSessionExpired() {
    (reduxStore.dispatch as Dispatch)(querybookUIActions.setSessionExpired());
}

export function setBrowserTitle(title = '', withSuffix = true) {
    const appName = getAppName();
    const formattedTitle = withSuffix
        ? title
            ? title + ' - ' + appName
            : appName
        : title;
    if (document.title !== formattedTitle) {
        document.title = formattedTitle;
    }
}
