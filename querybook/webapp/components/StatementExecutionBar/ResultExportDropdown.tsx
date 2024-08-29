import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

import { TableUploaderForm } from 'components/TableUploader/TableUploaderForm';
import { useMetastoresForUpload } from 'components/TableUploader/useQueryEnginesForUpload';
import { ComponentType, ElementType } from 'const/analytics';
import {
    IQueryResultExporter,
    IStatementExecution,
    IStatementResult,
} from 'const/queryExecution';
import { trackClick } from 'lib/analytics';
import { getStatementExecutionResultDownloadUrl } from 'lib/query-execution';
import {
    getExporterAuthentication,
    pollExporterTaskPromise,
} from 'lib/result-export';
import * as Utils from 'lib/utils';
import { tableToTSV } from 'lib/utils/table-export';
import { IStoreState } from 'redux/store/types';
import { StatementResource } from 'resource/queryExecution';
import { Button, TextButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { ListMenu } from 'ui/Menu/ListMenu';
import { Modal } from 'ui/Modal/Modal';
import { updateValue, validateForm } from 'ui/SmartForm/formFunctions';
import { SmartForm } from 'ui/SmartForm/SmartForm';

import { ResultExportSuccessToast } from './ResultExportSuccessToast';

import './ResultExportDropdown.scss';

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
        <Modal onHide={onHide} title="Exporter Form">
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
        </Modal>
    );
};

export const ResultExportDropdown: React.FunctionComponent<IProps> = ({
    statementExecution,
}) => {
    const statementId = statementExecution.id;

    const [exporterForForm, setExporterForForm] =
        React.useState<IQueryResultExporter>(null);

    const statementExporters = useSelector(
        (state: IStoreState) => state.queryExecutions.statementExporters
    );
    const statementResult = useSelector(
        (state: IStoreState) =>
            state.queryExecutions.statementResultById[statementId]
    );

    const trackExportButtonClick = React.useCallback(
        (exporterName: string) => {
            trackClick({
                component: ComponentType.DATADOC_QUERY_CELL,
                element: ElementType.RESULT_EXPORT_BUTTON,
                aux: {
                    name: exporterName,
                },
            });
        },
        [trackClick]
    );

    const onDownloadClick = React.useCallback(() => {
        trackExportButtonClick('Download CSV');

        const url = getStatementExecutionResultDownloadUrl(statementId);
        if (url) {
            Utils.download(url, `${statementId}.csv`);
        } else {
            toast.error('No valid url!');
        }
    }, [statementId]);

    const onExportTSVClick = React.useCallback(async () => {
        trackExportButtonClick('Copy to Clipboard');

        const rawResult = statementResult?.data || [];
        const parsedResult = tableToTSV(rawResult);
        Utils.copy(parsedResult);
        toast.success('Copied!');
    }, [statementResult]);

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
                        duration: Infinity,
                    },
                }
            );
        },
        [statementId]
    );

    const onGenericExportClick = React.useCallback(
        (exporter: IQueryResultExporter, showExportForm: boolean) => {
            trackExportButtonClick(exporter.name);

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

    const hasMetastoresForUpload = useMetastoresForUpload().length > 0;
    const [showTableUploadForm, setShowTableUploadForm] = useState(false);

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
                icon: 'Download',
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
                icon: 'Copy',
            },
            ...(hasMetastoresForUpload
                ? [
                      {
                          name: 'Create Table from Result',
                          onClick: () => {
                              trackExportButtonClick('Create Table');
                              setShowTableUploadForm(true);
                          },
                          icon: 'Upload',
                      },
                  ]
                : []),
            ...statementExporters.map((exporter) => ({
                name: (
                    <div className="horizontal-space-between">
                        <span>{exporter.name}</span>
                        {exporter.form ? (
                            <IconButton
                                noPadding
                                tooltip="More Export Options"
                                tooltipPos="left"
                                size={16}
                                icon="FormInput"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onGenericExportClick(exporter, true);
                                }}
                                className="ml8"
                            />
                        ) : null}
                    </div>
                ),
                onClick: onGenericExportClick.bind(null, exporter, false),
                icon: exporter.type === 'url' ? 'external-link' : 'copy',
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
                        icon="Download"
                        title="Export"
                    />
                )}
                layout={['bottom', 'right']}
                usePortal
            >
                <ListMenu
                    className="ResultExportDropdown-menu"
                    items={additionalButtons}
                />
            </Dropdown>
        );

    const tableUploadForm = showTableUploadForm && (
        <TableUploaderForm
            onHide={() => setShowTableUploadForm(false)}
            queryExecutionId={statementExecution.query_execution_id}
        />
    );

    return (
        <>
            {ellipsesDropDownButton}
            {formModal}
            {tableUploadForm}
        </>
    );
};
