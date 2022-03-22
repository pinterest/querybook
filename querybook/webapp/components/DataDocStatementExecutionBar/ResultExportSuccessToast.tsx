import React from 'react';

import { Modal } from 'ui/Modal/Modal';
import { Link } from 'ui/Link/Link';
import { Title } from 'ui/Title/Title';
import { CopyPasteModal } from 'ui/CopyPasteModal/CopyPasteModal';
import { IQueryExecutionExportStatusInfo } from 'const/queryExecution';
import toast from 'react-hot-toast';

const UrlModal: React.FunctionComponent<{
    url: string;
    title: string;
    onHide: () => any;
}> = ({ url, title, onHide }) => (
    <Modal onHide={onHide}>
        <div className="flex-center mv24">
            <Title size="med">{title}</Title>
            <Link to={url} newTab>
                View Export
            </Link>
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
