import React from 'react';

import { Button } from 'ui/Button/Button';
import { Modal } from 'ui/Modal/Modal';
import { CopyPasteModal } from 'ui/CopyPasteModal/CopyPasteModal';
import { IQueryExecutionExportStatusInfo } from 'const/queryExecution';
import history from 'lib/router-history';
import toast from 'react-hot-toast';

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
    const title = 'Completed exporting statement execution results!';

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
