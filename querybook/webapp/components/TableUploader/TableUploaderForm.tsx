import React, { useCallback, useMemo } from 'react';
import ds from 'lib/datasource';
import { TableUploaderStepValue, ITableUploadFormikForm } from './types';
import { Formik } from 'formik';
import { TableUploaderStep } from './TableUploaderStep';
import { ITableUploaderSourceForm } from './TableUploaderSourceForm';
import { TableUploaderSpecForm } from './TableUploaderSpecForm';
import { TableUploaderConfirmForm } from './TableUploaderConfirmForm';

interface ITableUploaderFormProps {
    metastoreId: number;
}

export const TableUploaderForm: React.FC<ITableUploaderFormProps> = ({
    metastoreId,
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
        (tableUploadConfig: ITableUploadFormikForm) => {
            const {
                auto_generated_column_types: _,
                ...uploadForm
            } = tableUploadConfig;

            ds.upload(`/table_upload/preview/`, uploadForm);
        },
        []
    );

    return (
        <div className="TableUploaderForm">
            <Formik initialValues={initialUploadConfig} onSubmit={handleSubmit}>
                {() => (
                    <TableUploaderStep>
                        {(step) => {
                            if (step === TableUploaderStepValue.SourceConfig) {
                                return <ITableUploaderSourceForm />;
                            } else if (
                                step === TableUploaderStepValue.TableConfig
                            ) {
                                return (
                                    <TableUploaderSpecForm
                                        metastoreId={metastoreId}
                                    />
                                );
                            } else {
                                return <TableUploaderConfirmForm />;
                            }
                        }}
                    </TableUploaderStep>
                )}
            </Formik>
        </div>
    );
};
