import React from 'react';
import toast from 'react-hot-toast';

import { IQueryExecutionExportStatusInfo } from 'const/queryExecution';
import { Button } from 'ui/Button/Button';
import { CopyPasteModal } from 'ui/CopyPasteModal/CopyPasteModal';
import { Modal } from 'ui/Modal/Modal';

const UrlModal: React.FunctionComponent<{
    url: string;
    title: string;
    onHide: () => any;
}> = ({ url, title, onHide }) => (
    <Modal onHide={onHide} title={title}>
        <div className="flex-center mv24">
            <Button title="View Export" onClick={() => window.open(url)} />
        </div>
    </Modal>
);

export const ResultExportSuccessToast = (
    data: IQueryExecutionExportStatusInfo
) => {
    const { result: exportedInfo, task_id: taskId } = data;
    const title = 'Export Complete';

    return exportedInfo.type === 'url' ? (
        <UrlModal
            url={exportedInfo.info}
            title={title}
            onHide={() => toast.dismiss(taskId)}
        />
    ) : (
        <CopyPasteModal
            text={exportedInfo.info}
            title={title}
            onHide={() => toast.dismiss(taskId)}
        />
    );
};
