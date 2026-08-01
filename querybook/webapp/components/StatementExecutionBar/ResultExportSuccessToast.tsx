import React from 'react';
import toast from 'react-hot-toast';

import {
    IQueryExecutionExportStatusInfo,
    IUrlExportResult,
} from 'const/queryExecution';
import { Button } from 'ui/Button/Button';
import { CopyPasteModal } from 'ui/CopyPasteModal/CopyPasteModal';
import { Message } from 'ui/Message/Message';
import { Modal } from 'ui/Modal/Modal';

const openExport = (url: string) => window.open(url);

export const UrlExportRedirect: React.FunctionComponent<{
    exportResult: IUrlExportResult;
    onHide: () => void;
    open?: (url: string) => void;
}> = ({
    exportResult: { url, message, message_type: messageType = 'warning' },
    onHide,
    open = openExport,
}) => {
    return (
        <Modal onHide={onHide} title="Export Complete">
            {message ? <Message type={messageType}>{message}</Message> : null}
            <div className="flex-center mv24">
                <Button title="View Export" onClick={() => open(url)} />
            </div>
        </Modal>
    );
};

export const ResultExportSuccessToast = (
    data: IQueryExecutionExportStatusInfo,
) => {
    const { result: exportedInfo, task_id: taskId } = data;
    const title = 'Export Complete';

    if (!exportedInfo) {
        return null;
    }

    return exportedInfo.type === 'url' ? (
        <UrlExportRedirect
            exportResult={
                typeof exportedInfo.info === 'string'
                    ? { url: exportedInfo.info }
                    : exportedInfo.info
            }
            onHide={() => toast.dismiss(taskId)}
        />
    ) : (
        <CopyPasteModal
            text={String(exportedInfo.info)}
            title={title}
            onHide={() => toast.dismiss(taskId)}
        />
    );
};
