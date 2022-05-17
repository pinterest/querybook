import React, { useCallback, useMemo } from 'react';
import { TableUploaderStepValue, ITableUploadFormikForm } from './types';
import { Formik } from 'formik';
import toast from 'react-hot-toast';
import {
    TableUploaderStepFooter,
    TableUploaderStepHeader,
    useTableUploaderStep,
} from './TableUploaderStep';
import { ITableUploaderSourceForm } from './TableUploaderSourceForm';
import { TableUploaderSpecForm } from './TableUploaderSpecForm';
import { TableUploaderConfirmForm } from './TableUploaderConfirmForm';
import { TableUploadResource } from 'resource/tableUpload';
import { Modal } from 'ui/Modal/Modal';
import { navigateWithinEnv } from 'lib/utils/query-string';

interface ITableUploaderFormProps {
    metastoreId?: number;
    queryExecutionId?: number;
    onHide: () => void;
}

export const TableUploaderForm: React.FC<ITableUploaderFormProps> = ({
    metastoreId,
    queryExecutionId,
    onHide,
}) => {
    const initialUploadConfig: ITableUploadFormikForm = useMemo(
        () => ({
            file: null,
            engine_id: null,
            metastore_id: metastoreId,
            table_config: {
                // Table creation configs
                engine_id: null,
                if_exists: 'replace',
                table_name: '',
                schema_name: '',
                column_name_types: [],
            },
            import_config:
                queryExecutionId != null
                    ? {
                          source_type: 'query_execution',
                          query_execution_id: queryExecutionId,
                      }
                    : {
                          source_type: 'file',
                          parse_config: {
                              delimiter: ',',
                              first_row_column: true,
                              col_names: '',
                              skip_rows: 0,
                              max_rows: null,
                              skip_blank_lines: true,
                              skip_initial_space: true,
                          },
                      },
            auto_generated_column_types: false,
        }),
        [metastoreId, queryExecutionId]
    );

    const handleSubmit = useCallback(
        async (tableUploadConfig: ITableUploadFormikForm) => {
            const {
                auto_generated_column_types: _,
                ...uploadForm
            } = tableUploadConfig;

            const createTablePromise = TableUploadResource.createTable(
                uploadForm
            );

            const { data: tableId } = await toast.promise(createTablePromise, {
                loading: 'Creating table...',
                success: 'Table created!',
                error: 'Fail to create table',
            });

            navigateWithinEnv(`/table/${tableId}`);
            onHide();
        },
        [onHide]
    );

    return (
        <Formik initialValues={initialUploadConfig} onSubmit={handleSubmit}>
            <TableUploaderFormModal onHide={onHide} />
        </Formik>
    );
};

const TableUploaderFormModal: React.FC<{
    onHide: () => void;
}> = ({ onHide }) => {
    const [step, maxStep, setStep] = useTableUploaderStep();

    let formDOM: React.ReactNode;
    if (step === TableUploaderStepValue.SourceConfig) {
        formDOM = <ITableUploaderSourceForm />;
    } else if (step === TableUploaderStepValue.TableConfig) {
        formDOM = <TableUploaderSpecForm />;
    } else {
        formDOM = <TableUploaderConfirmForm />;
    }

    return (
        <Modal
            onHide={onHide}
            topDOM={<TableUploaderStepHeader step={step} />}
            bottomDOM={
                <TableUploaderStepFooter
                    step={step}
                    maxStep={maxStep}
                    setStep={setStep}
                />
            }
        >
            {formDOM}
        </Modal>
    );
};
