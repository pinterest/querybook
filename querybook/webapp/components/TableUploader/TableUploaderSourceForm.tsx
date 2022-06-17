import { useFormikContext } from 'formik';
import React from 'react';

import { UploadSourceType } from 'const/tableUpload';
import { IOptions } from 'lib/utils/react-select';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';

import { FileUploaderArea } from './FileUploaderArea';
import { ITableUploadFormikForm } from './types';

export const UploadSourceTypeOptions: IOptions<UploadSourceType> = [
    {
        value: 'file',
        label: 'File Upload',
    },
    { value: 'query_execution', label: 'Query Execution' },
];

const queryExecutionUrlRegex = /\/query_execution\/([0-9]+)/;

export const ITableUploaderSourceForm: React.FC = ({}) => {
    const { values, setFieldValue } =
        useFormikContext<ITableUploadFormikForm>();

    let sourceTypeForm: React.ReactNode;
    if (values.import_config.source_type === 'file') {
        sourceTypeForm = (
            <>
                <div className="center-align mv12">
                    <FileUploaderArea
                        onUpload={(f) => setFieldValue('file', f)}
                        file={values.file}
                    />
                </div>

                {values.file && (
                    <>
                        <SimpleField
                            type="input"
                            name="import_config.parse_config.delimiter"
                            help="Are the columns comma separated, tab separated, or other?"
                        />

                        <SimpleField
                            type="number"
                            name="import_config.parse_config.skip_rows"
                        />
                        <SimpleField
                            type="number"
                            name="import_config.parse_config.max_rows"
                            help="Determine how many rows to upload, put nothing or 0 for unlimited"
                        />
                        <SimpleField
                            type="checkbox"
                            name="import_config.parse_config.first_row_column"
                        />
                        {!values.import_config.parse_config
                            .first_row_column && (
                            <SimpleField
                                type="input"
                                name="import_config.parse_config.col_names"
                                help="List of column names, comma separated"
                            />
                        )}

                        <SimpleField
                            type="checkbox"
                            name="import_config.parse_config.skip_blank_lines"
                            help="If true, skip empty lines in CSV intead of inserting a row of NULL"
                        />
                        <SimpleField
                            type="checkbox"
                            name="import_config.parse_config.skip_initial_space"
                            help="Skip spaces after delimiter"
                        />
                    </>
                )}
            </>
        );
    } else if (values.import_config.source_type === 'query_execution') {
        sourceTypeForm = (
            <>
                <SimpleField
                    type="input"
                    name="import_config.query_execution_id"
                    label="Execution Id"
                    help="You can also put the query execution url here (Click on share execution in the query execution view)"
                    onChange={(newInput) => {
                        const inputUrlMatch = newInput.match(
                            queryExecutionUrlRegex
                        );
                        let queryExecutionId = newInput;
                        if (inputUrlMatch) {
                            queryExecutionId = inputUrlMatch[1];
                        }
                        setFieldValue(
                            'import_config.query_execution_id',
                            queryExecutionId
                        );
                    }}
                />
            </>
        );
    }

    return (
        <FormWrapper minLabelWidth="160px">
            <SimpleField
                type="react-select"
                options={UploadSourceTypeOptions}
                name="import_config.source_type"
            />
            {sourceTypeForm}
        </FormWrapper>
    );
};
