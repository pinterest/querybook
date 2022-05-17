import {
    UploadedTableColumnTypes,
    UploadedTableIfExistOptions,
} from 'const/tableUpload';
import { FieldArray, useFormikContext } from 'formik';
import React, { useCallback, useEffect } from 'react';
import { TableUploadResource } from 'resource/tableUpload';
import { Button } from 'ui/Button/Button';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { StyledText } from 'ui/StyledText/StyledText';
import { ITableUploadFormikForm } from './types';
import {
    useMetastoresForUpload,
    useQueryEnginesForUpload,
} from './useQueryEnginesForUpload';

export const TableUploaderSpecForm: React.FC = ({}) => {
    const {
        values,
        setFieldValue,
    } = useFormikContext<ITableUploadFormikForm>();

    const possibleMetastores = useMetastoresForUpload();
    const possibleQueryEngines = useQueryEnginesForUpload(values.metastore_id);

    const loadColumnTypes = useCallback(() => {
        TableUploadResource.previewColumns({
            import_config: values.import_config,
            file: values.file,
        }).then(({ data }) => {
            setFieldValue('table_config.column_name_types', data);
        });
    }, [values.file, values.import_config, setFieldValue]);

    useEffect(() => {
        if (!values.auto_generated_column_types) {
            loadColumnTypes();
            setFieldValue('auto_generated_column_types', true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values.auto_generated_column_types, loadColumnTypes, setFieldValue]);

    // Auto set query engine to be the first one if none is selected
    useEffect(() => {
        if (possibleQueryEngines.length === 0) {
            return;
        }
        if (
            possibleQueryEngines.find(
                (engine) => engine.id === values.engine_id
            )
        ) {
            return;
        }

        setFieldValue('engine_id', possibleQueryEngines[0].id);
    }, [possibleQueryEngines, values.engine_id, setFieldValue]);

    return (
        <div>
            <div>
                <StyledText color="light" size="smedium" weight="bold">
                    Required Fields
                </StyledText>
            </div>
            <FormWrapper minLabelWidth="140px">
                <SimpleField
                    name="metastore_id"
                    type="react-select"
                    label="Metastore"
                    options={possibleMetastores.map((store) => ({
                        label: store.name,
                        value: store.id,
                    }))}
                />
                {values.metastore_id != null && (
                    <SimpleField
                        name="engine_id"
                        type="react-select"
                        label="Query Engine"
                        options={possibleQueryEngines.map((engine) => ({
                            label: engine.name,
                            value: engine.id,
                        }))}
                    />
                )}

                <SimpleField name="table_config.schema_name" type="input" />
                <SimpleField name="table_config.table_name" type="input" />
                <SimpleField
                    name="table_config.if_exists"
                    type="react-select"
                    options={
                        (UploadedTableIfExistOptions as unknown) as string[]
                    }
                    help="Behavior if the table is already defined. Note: append only works for some databases"
                />
            </FormWrapper>

            <FieldArray
                name="table_config.column_name_types"
                render={() => {
                    const columnRowDOMs = values.table_config.column_name_types.map(
                        (_, idx) => (
                            <div key={idx} className="flex-row">
                                <div className="flex1">
                                    <SimpleField
                                        name={`table_config.column_name_types[${idx}][0]`}
                                        label={() => null}
                                        type="input"
                                    />
                                </div>
                                <div className="flex1">
                                    <SimpleField
                                        name={`table_config.column_name_types[${idx}][1]`}
                                        label={() => null}
                                        type="react-select"
                                        options={
                                            (UploadedTableColumnTypes as unknown) as string[]
                                        }
                                        creatable
                                        withDeselect
                                    />
                                </div>
                            </div>
                        )
                    );

                    return (
                        <div className="mt20">
                            <div className="horizontal-space-between">
                                <StyledText
                                    color="light"
                                    size="smedium"
                                    weight="bold"
                                >
                                    Columns
                                </StyledText>

                                <Button
                                    icon="RefreshCw"
                                    title="Reset columns"
                                    onClick={loadColumnTypes}
                                />
                            </div>
                            <div className="mv4">
                                <StyledText
                                    color="lightest"
                                    weight="light"
                                    size="small"
                                >
                                    The types are auto-generated will be
                                    converted to the applicable type for the
                                    query engine. You can also provide your own
                                    typing.
                                </StyledText>
                            </div>

                            {columnRowDOMs}
                        </div>
                    );
                }}
            />
        </div>
    );
};
