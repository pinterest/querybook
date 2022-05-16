import React, { useCallback, useMemo } from 'react';
import { TableUploaderStepValue, ITableUploadFormikForm } from './types';
import { Formik } from 'formik';
import {
    TableUploaderStepFooter,
    TableUploaderStepHeader,
    useTableUploaderStep,
} from './TableUploaderStep';
import { ITableUploaderSourceForm } from './TableUploaderSourceForm';
import { TableUploaderSpecForm } from './TableUploaderSpecForm';
import { TableUploaderConfirmForm } from './TableUploaderConfirmForm';
import { TableUploadResource } from 'resource/tableUpload';
import toast from 'react-hot-toast';
import { Modal } from 'ui/Modal/Modal';

interface ITableUploaderFormProps {
    metastoreId: number;
    onCompletion: (tableId: number) => void;
    onHide: () => void;
}

export const TableUploaderForm: React.FC<ITableUploaderFormProps> = ({
    metastoreId,
    onCompletion,
    onHide,
}) => {
    const initialUploadConfig: ITableUploadFormikForm = useMemo(
        () => ({
            file: null,
            engine_id: null,
            table_config: {
                // Table creation configs
                engine_id: null,
                if_exists: 'replace',
                table_name: '',
                schema_name: '',
                column_name_types: [],
            },
            import_config: {
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
        []
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

            onCompletion(tableId);
        },
        [onCompletion]
    );

    return (
        <Formik initialValues={initialUploadConfig} onSubmit={handleSubmit}>
            <TableUploaderFormModal onHide={onHide} metastoreId={metastoreId} />
        </Formik>
    );
};

const TableUploaderFormModal: React.FC<{
    onHide: () => void;
    metastoreId: number;
}> = ({ onHide, metastoreId }) => {
    const [step, maxStep, setStep] = useTableUploaderStep();

    let formDOM: React.ReactNode;
    if (step === TableUploaderStepValue.SourceConfig) {
        formDOM = <ITableUploaderSourceForm />;
    } else if (step === TableUploaderStepValue.TableConfig) {
        formDOM = <TableUploaderSpecForm metastoreId={metastoreId} />;
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
