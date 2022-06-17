import { useFormikContext } from 'formik';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getHumanReadableByteSize } from 'lib/utils/number';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';
import { IStoreState } from 'redux/store/types';
import { Message } from 'ui/Message/Message';
import { StyledText } from 'ui/StyledText/StyledText';
import { Tag, TagGroup } from 'ui/Tag/Tag';

import { ITableUploadFormikForm } from './types';

export const TableUploaderConfirmForm: React.FC = () => {
    const { values } = useFormikContext<ITableUploadFormikForm>();

    const queryEngine = useSelector(
        (state: IStoreState) =>
            queryEngineByIdEnvSelector(state)[values.engine_id]
    );

    const renderSourceInfoDOM = () => {
        let sourceInfoDOM: React.ReactNode;
        if (values.import_config.source_type === 'file') {
            sourceInfoDOM = (
                <div>
                    <StyledText weight="light">
                        The following file will be uploaded: {values.file.name}{' '}
                        ({getHumanReadableByteSize(values.file.size)})
                    </StyledText>
                </div>
            );
        } else if (values.import_config.source_type === 'query_execution') {
            sourceInfoDOM = (
                <div>
                    <StyledText>
                        Execution {values.import_config.query_execution_id} will
                        be converted to table.
                    </StyledText>
                </div>
            );
        } else {
            sourceInfoDOM = <div>{JSON.stringify(values.import_config)}</div>;
        }

        return (
            <div className="mv12">
                <StyledText weight="bold" size="med">
                    Table Source
                </StyledText>
                {sourceInfoDOM}
            </div>
        );
    };

    const tablePseudoQuery = useMemo(() => {
        const tableConfig = values.table_config;
        const tableFullName = tableConfig.schema_name
            ? `${tableConfig.schema_name}.${tableConfig.table_name}`
            : tableConfig.table_name;
        const columns = tableConfig.column_name_types
            .map(([colName, colType]) => `\t${colName} ${colType}`)
            .join(',\n');
        const ifExists = `IF EXISTS ${tableConfig.if_exists}`;

        return `CREATE TABLE ${tableFullName} ${ifExists} (\n${columns}\n)`;
    }, [values.table_config]);

    const renderTableSpecDOM = () => {
        const engineInfoDOM = (
            <>
                <TagGroup>
                    <Tag highlighted>Engine Name</Tag>
                    <Tag>{queryEngine.name}</Tag>
                </TagGroup>

                <TagGroup>
                    <Tag highlighted>Engine Type</Tag>
                    <Tag>{queryEngine.language}</Tag>
                </TagGroup>
            </>
        );

        const queryInfoDOM = (
            <div>
                <StyledText size="smedium">
                    Verify this is the table you want to create.
                </StyledText>
                <StyledText size="xsmall" color="lightest">
                    Note: this is not the actual query that will be executed.
                </StyledText>

                <Message>
                    <StyledText>{tablePseudoQuery}</StyledText>
                </Message>
            </div>
        );

        return (
            <div>
                <div className="mb4 flex-row">
                    <StyledText weight="bold" size="med" className="mr8">
                        Table Spec
                    </StyledText>
                    {engineInfoDOM}
                </div>

                {queryInfoDOM}
            </div>
        );
    };

    return (
        <div>
            <div className="mb12">
                <StyledText size="large" weight="bold">
                    Confirm Upload Details
                </StyledText>
            </div>
            {renderSourceInfoDOM()}
            {renderTableSpecDOM()}
        </div>
    );
};
