import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
    IStatementExecution,
    IStatementResult,
    IQueryResultExporter,
} from 'redux/queryExecutions/types';
import * as queryExecutionsActions from 'redux/queryExecutions/action';
import { IStoreState, Dispatch } from 'redux/store/types';

import ds from 'lib/datasource';
import * as Utils from 'lib/utils';
import { getStatementExecutionResultDownloadUrl } from 'lib/query-execution';
import { getExporterAuthentication } from 'lib/result-export';

import { Dropdown } from 'ui/Dropdown/Dropdown';
import { Button } from 'ui/Button/Button';
import { CopyPasteModal } from 'ui/CopyPasteModal/CopyPasteModal';
import { sendNotification } from 'lib/dataHubUI';
import { Modal } from 'ui/Modal/Modal';
import { Link } from 'ui/Link/Link';
import { ListMenu } from 'ui/Menu/ListMenu';
import { Title } from 'ui/Title/Title';
import { validateForm, updateValue } from 'ui/SmartForm/formFunctions';
import { SmartForm } from 'ui/SmartForm/SmartForm';

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
            <div className="flex-center mv24">
                <Title size={5}>
                    <Link to={url} newTab>
                        View Export
                    </Link>
                </Title>
            </div>
        </Modal>
    );
};

const FormModal: React.FunctionComponent<{
    form: IStructFormField;
    onSubmit: (data: {}) => any;
    onHide: () => any;
}> = ({ form, onSubmit, onHide }) => {
    const [formData, setFormData] = React.useState({});
    return (
        <Modal onHide={onHide}>
            <div className="m24">
                <SmartForm
                    formField={form}
                    value={formData}
                    onChange={(path, value) =>
                        setFormData(
                            updateValue(formData, path, value, [undefined, ''])
                        )
                    }
                />
                <br />
                <div className="right-align mb12">
                    <Button onClick={() => onSubmit(formData)}>Submit</Button>
                </div>
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
    const [exporterForForm, setExporterForForm] = React.useState<
        IQueryResultExporter
    >(null);

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
        const parsedResult = rawResult
            .map((row) =>
                row.map((cell) => cell.replace(/\s/g, ' ')).join('\t')
            )
            .join('\n');
        setExportedInfo({
            info: parsedResult,
            type: 'text',
        });
    }, [statementId, statementResult, loadStatementResult]);

    const handleExport = React.useCallback(
        async (exporter: IQueryResultExporter, formData?: {}) => {
            try {
                await getExporterAuthentication(exporter);

                sendNotification(`Exporting, please wait`);
                const params = { export_name: exporter.name };
                if (formData) {
                    params['exporter_params'] = formData;
                }
                const { data } = await ds.fetch(
                    `/query_execution_exporter/statement_execution/${statementId}/`,
                    params
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

    const onGenericExportClick = React.useCallback(
        (exporter: IQueryResultExporter) => {
            const hasRequired =
                exporter.form && !validateForm({}, exporter.form)[0];
            if (hasRequired) {
                setExporterForForm(exporter);
            } else {
                handleExport(exporter);
            }
        },
        []
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

    const formModal = exporterForForm ? (
        <FormModal
            form={exporterForForm.form}
            onHide={() => setExporterForForm(null)}
            onSubmit={(data) => {
                setExporterForForm(null);
                handleExport(exporterForForm, data);
            }}
        />
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
            <Dropdown
                className={'inline'}
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
                isRight
                usePortal
            >
                <ListMenu items={additionalButtons} isRight />
            </Dropdown>
        );
    return (
        <>
            {ellipsesDropDownButton}
            {exportedInfoModal}
            {formModal}
        </>
    );
};
