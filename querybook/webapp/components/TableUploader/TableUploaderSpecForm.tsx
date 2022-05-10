import {
    UploadedTableColumnTypes,
    UploadedTableIfExistOptions,
} from 'const/tableUpload';
import { FieldArray, useFormikContext } from 'formik';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { queryEngineSelector } from 'redux/queryEngine/selector';
import { TableUploadResource } from 'resource/tableUpload';
import { Button } from 'ui/Button/Button';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { StyledText } from 'ui/StyledText/StyledText';
import { ITableUploadFormikForm } from './types';

export const TableUploaderSpecForm: React.FC<{
    metastoreId: number;
}> = ({ metastoreId }) => {
    const {
        values,
        setFieldValue,
    } = useFormikContext<ITableUploadFormikForm>();
    const possibleQueryEngines = useQueryEngineInMetastore(metastoreId);

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

    return (
        <div>
            <SimpleField
                name="engine_id"
                type="react-select"
                label="Query Engine to Upload"
                options={possibleQueryEngines.map((engine) => ({
                    label: engine.name,
                    value: engine.id,
                }))}
                stacked
            />
            <SimpleField name="table_config.schema_name" type="input" stacked />
            <SimpleField name="table_config.table_name" type="input" stacked />
            <SimpleField
                name="table_config.if_exists"
                type="react-select"
                options={(UploadedTableIfExistOptions as unknown) as string[]}
                help="Behavior if the table is already defined. Note: append only works for some databases"
                stacked
            />

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
                        <div className="mt16">
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
                                    title="Set columns from upload source"
                                    onClick={loadColumnTypes}
                                />
                            </div>
                            <div className="mv4">
                                <StyledText
                                    color="lightest"
                                    weight="light"
                                    size="small"
                                >
                                    The types provided will be auto-converted to
                                    the applicable type for the query engine.
                                    You can also override the default types for
                                    custom type.
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

function useQueryEngineInMetastore(metastoreId: number) {
    const queryEngines = useSelector(queryEngineSelector);
    return useMemo(
        () =>
            queryEngines.filter(
                (engine) => engine.metastore_id === metastoreId
            ),
        [queryEngines, metastoreId]
    );
}
