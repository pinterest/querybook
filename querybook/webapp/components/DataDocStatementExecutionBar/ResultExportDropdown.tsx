import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import {
    IStatementExecution,
    IStatementResult,
    IQueryResultExporter,
} from 'const/queryExecution';
import * as queryExecutionsActions from 'redux/queryExecutions/action';
import { IStoreState, Dispatch } from 'redux/store/types';

import * as Utils from 'lib/utils';
import { getStatementExecutionResultDownloadUrl } from 'lib/query-execution';
import { tableToTSV } from 'lib/utils/table-export';

import { Dropdown } from 'ui/Dropdown/Dropdown';
import { Button, TextButton } from 'ui/Button/Button';
import { Modal } from 'ui/Modal/Modal';
import { ListMenu } from 'ui/Menu/ListMenu';
import { validateForm, updateValue } from 'ui/SmartForm/formFunctions';
import { SmartForm } from 'ui/SmartForm/SmartForm';
import { IconButton } from 'ui/Button/IconButton';
import './ResultExportDropdown.scss';
import {
    getExporterAuthentication,
    pollExporterTaskPromise,
} from 'lib/result-export';
import { StatementResource } from 'resource/queryExecution';
import { ResultExportSuccessToast } from './ResultExportSuccessToast';

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

const FormModal: React.FunctionComponent<{
    form: IStructFormField;
    onSubmit: (data: Record<string, unknown>) => any;
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

    const [
        exporterForForm,
        setExporterForForm,
    ] = React.useState<IQueryResultExporter>(null);

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
            toast.error('No valid url!');
        }
    }, [statementId]);

    const onExportTSVClick = React.useCallback(async () => {
        const rawResult =
            statementResult?.data || (await loadStatementResult(statementId));
        const parsedResult = tableToTSV(rawResult);
        Utils.copy(parsedResult);
        toast.success('Copied!');
    }, [statementId, statementResult, loadStatementResult]);

    const handleExport = React.useCallback(
        async (
            exporter: IQueryResultExporter,
            formData?: Record<string, unknown>
        ) => {
            await getExporterAuthentication(exporter);
            const { data: taskId } = await StatementResource.export(
                statementId,
                exporter.name,
                formData
            );

            return toast.promise(
                pollExporterTaskPromise(taskId),
                {
                    loading: 'Exporting, please wait',
                    success: ResultExportSuccessToast,
                    error: (e) =>
                        `Cannot ${exporter.name.toLowerCase()}, reason: ${e}`,
                },
                {
                    id: taskId,
                    success: {
                        style: {
                            display: 'none',
                        },
                    },
                }
            );
        },
        [statementId]
    );

    const onGenericExportClick = React.useCallback(
        (exporter: IQueryResultExporter, showExportForm: boolean) => {
            if (
                showExportForm ||
                // In this case, check if the form is required to be filled before export
                (exporter.form && !validateForm({}, exporter.form)[0])
            ) {
                setExporterForForm(exporter);
            } else {
                handleExport(exporter);
            }
        },
        [handleExport]
    );

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
                name: (
                    <span>
                        Copy{' '}
                        {isPreviewFullResult(
                            statementExecution,
                            statementResult
                        ) ? (
                            'Full Result'
                        ) : (
                            <span style={{ color: 'var(--color-accent-dark)' }}>
                                Preview
                            </span>
                        )}{' '}
                        to Clipboard (as TSV)
                    </span>
                ),
                onClick: onExportTSVClick,
                icon: 'fas fa-copy',
            },
            ...statementExporters.map((exporter) => ({
                name: (
                    <div className="horizontal-space-between flex1">
                        <span>{exporter.name}</span>
                        {exporter.form ? (
                            <IconButton
                                noPadding
                                tooltip="Detailed Export"
                                tooltipPos="left"
                                size={16}
                                icon="share"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onGenericExportClick(exporter, true);
                                }}
                            />
                        ) : null}
                    </div>
                ),
                onClick: onGenericExportClick.bind(null, exporter, false),
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
                    <TextButton
                        size="small"
                        onClick={onDownloadClick}
                        icon="download"
                        title="Export"
                    />
                )}
                isRight
                usePortal
            >
                <ListMenu
                    className="ResultExportDropdown-menu"
                    items={additionalButtons}
                    isRight
                />
            </Dropdown>
        );
    return (
        <>
            {ellipsesDropDownButton}
            {formModal}
        </>
    );
};
