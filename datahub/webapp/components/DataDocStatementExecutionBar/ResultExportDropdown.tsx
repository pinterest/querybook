import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
    IStatementExecution,
    IStatementResult,
    IStatementExporter,
} from 'redux/queryExecutions/types';
import * as queryExecutionsActions from 'redux/queryExecutions/action';
import { IStoreState, Dispatch } from 'redux/store/types';

import ds from 'lib/datasource';
import * as Utils from 'lib/utils';
import { getStatementExecutionResultDownloadUrl } from 'lib/query-execution';

import { DropdownMenu } from 'ui/DropdownMenu/DropdownMenu';
import { Button } from 'ui/Button/Button';
import { CopyPasteModal } from 'ui/CopyPasteModal/CopyPasteModal';
import { sendNotification } from 'lib/dataHubUI';
import { Modal } from 'ui/Modal/Modal';
import { Link } from 'ui/Link/Link';
import { Title } from 'ui/Title/Title';

interface IProps {
    statementExecution: IStatementExecution;
}

function isPreviewFullResult(
    statementExecution: IStatementExecution,
    statementResult: IStatementResult
) {
    if (!statementExecution) {
        return null;
    }

    const { result_row_count: resultRowCount } = statementExecution;

    return (
        statementResult &&
        statementResult.data &&
        statementResult.data.length === resultRowCount
    );
}

const UrlModal: React.FunctionComponent<{
    url: string;
    onHide: () => any;
}> = ({ url, onHide }) => {
    return (
        <Modal onHide={onHide}>
            <div className="flex-center">
                <Title size={5}>
                    <Link to={url} newTab>
                        Click to view the exported result
                    </Link>
                </Title>
            </div>
        </Modal>
    );
};

export const ResultExportDropdown: React.FunctionComponent<IProps> = ({
    statementExecution,
}) => {
    const statementId = statementExecution.id;

    const [exportedInfo, setExportedInfo] = React.useState<{
        info: string;
        type: 'url' | 'text';
    }>(null);

    const dispatch: Dispatch = useDispatch();
    const statementExporters = useSelector(
        (state: IStoreState) => state.queryExecutions.statementExporters
    );
    const statementResult = useSelector(
        (state: IStoreState) =>
            state.queryExecutions.statementResultById[statementId]
    );
    const loadStatementResult = React.useCallback(
        (statementExecutionId: number) =>
            dispatch(queryExecutionsActions.fetchResult(statementExecutionId)),
        []
    );

    const onDownloadClick = React.useCallback(() => {
        const url = getStatementExecutionResultDownloadUrl(statementId);
        if (url) {
            Utils.download(url, `${statementId}.csv`);
        } else {
            sendNotification('No valid url!');
        }
    }, [statementId]);

    const onExportPreviewClick = React.useCallback(async () => {
        const rawResult =
            statementResult?.data || (await loadStatementResult(statementId));
        const parsedResult = rawResult.map((row) => row.join('\t')).join('\n');
        setExportedInfo({
            info: parsedResult,
            type: 'text',
        });
    }, [statementId, statementResult, loadStatementResult]);

    const onGenericExportClick = React.useCallback(
        async (exporter: IStatementExporter) => {
            try {
                sendNotification(`Exporting, please wait`);
                const { data } = await ds.fetch(
                    `/statement_execution/${statementId}/export/`,
                    {
                        export_name: exporter.name,
                    }
                );
                setExportedInfo({
                    info: data,
                    type: exporter.type,
                });
            } catch (e) {
                sendNotification(
                    `Cannot ${exporter.name.toLowerCase()}, reason: ${e}`
                );
            }
        },
        [statementId]
    );

    const exportedInfoModal =
        exportedInfo != null ? (
            exportedInfo.type === 'url' ? (
                <UrlModal
                    url={exportedInfo.info}
                    onHide={() => setExportedInfo(null)}
                />
            ) : (
                <CopyPasteModal
                    text={exportedInfo.info}
                    onHide={() => setExportedInfo(null)}
                />
            )
        ) : null;

    const additionalButtons = [];
    if (statementExecution.result_row_count > 0) {
        additionalButtons.push.apply(additionalButtons, [
            {
                name: 'Download Full Result (as CSV)',
                onClick: onDownloadClick,
                icon: 'fas fa-download',
            },
            {
                name: isPreviewFullResult(
                    statementExecution,
                    statementResult
                ) ? (
                    'Copy Full Result to Clipboard (as TSV)'
                ) : (
                    <span>
                        Copy{' '}
                        <span style={{ color: 'var(--color-accent-text)' }}>
                            Preview
                        </span>{' '}
                        to Clipboard (as TSV)
                    </span>
                ),
                onClick: onExportPreviewClick,
                icon: 'fas fa-copy',
            },
            ...statementExporters.map((exporter) => ({
                name: exporter.name,
                onClick: onGenericExportClick.bind(null, exporter),
                icon:
                    exporter.type === 'url'
                        ? 'fas fa-file-export'
                        : 'fas fa-copy',
            })),
        ]);
    }

    const ellipsesDropDownButton = additionalButtons.length > 0 &&
        statementExecution &&
        statementExecution.result_row_count > 0 && (
            <DropdownMenu
                className={'inline is-right'}
                customButtonRenderer={() => (
                    <Button
                        borderless
                        small
                        onClick={onDownloadClick}
                        icon="download"
                        title="Export"
                        type="inlineText"
                    />
                )}
                items={additionalButtons}
            />
        );
    return (
        <>
            {ellipsesDropDownButton}
            {exportedInfoModal}
        </>
    );
};
