import { ContentState } from 'draft-js';
import React, { useMemo } from 'react';

import { DataElement } from 'components/DataElement/DataElement';
import { DataElementDescription } from 'components/DataElement/DataElementDescription';
import { DataTableColumnStats } from 'components/DataTableStats/DataTableColumnStats';
import { TableTag } from 'components/DataTableTags/DataTableTags';
import { IDetailedDataColumn } from 'const/metastore';
import { convertRawToContentState } from 'lib/richtext/serialize';
import { Nullable } from 'lib/typescript';
import { parseType } from 'lib/utils/complex-types';
import { Card } from 'ui/Card/Card';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';
import { AccentText, StyledText } from 'ui/StyledText/StyledText';

import { DataTableColumnCardNestedType } from './DataTableColumnCardNestedType';

import './DataTableColumnCard.scss';

interface IProps {
    column: IDetailedDataColumn;
    onEditColumnDescriptionRedirect?: Nullable<() => Promise<void>>;
    updateDataColumnDescription: (
        columnId: number,
        description: ContentState
    ) => any;
}

export const DataTableColumnCard: React.FunctionComponent<IProps> = ({
    column,
    onEditColumnDescriptionRedirect,
    updateDataColumnDescription,
}) => {
    const parsedType = useMemo(() => parseType('', column.type), [column.type]);

    const tagsDOM = (column?.tags || []).map((tag) => (
        <TableTag tag={tag} readonly={true} key={tag.id} mini={true} />
    ));

    const columnDescription = convertRawToContentState(
        column.description as string
    );
    const descriptionContent = (
        <div>
            {column?.data_element_association &&
                !columnDescription.hasText() && (
                    <DataElementDescription
                        dataElementAssociation={column.data_element_association}
                    />
                )}
            <EditableTextField
                value={columnDescription}
                onSave={updateDataColumnDescription.bind(null, column.id)}
                placeholder="add column description"
                onEditRedirect={onEditColumnDescriptionRedirect}
            />
        </div>
    );
    return (
        <div className="DataTableColumnCard">
            <Card key={column.id} alignLeft>
                <div className="DataTableColumnCard-header">
                    <AccentText weight="extra" className="column-name">
                        {column.name}
                    </AccentText>
                    <StyledText color="light" className="column-type">
                        {column.type}
                    </StyledText>
                </div>
                <div className="mt16">
                    {parsedType.children && (
                        <KeyContentDisplay keyString="Type Detail">
                            <DataTableColumnCardNestedType
                                complexType={parsedType}
                            />
                        </KeyContentDisplay>
                    )}
                    {tagsDOM.length > 0 && (
                        <KeyContentDisplay keyString="Tags">
                            <div className="DataTableTags flex-row">
                                {tagsDOM}
                            </div>
                        </KeyContentDisplay>
                    )}
                    {column?.data_element_association && (
                        <KeyContentDisplay keyString="Data Element">
                            <DataElement
                                association={column.data_element_association}
                            />
                        </KeyContentDisplay>
                    )}
                    {column.comment && (
                        <KeyContentDisplay keyString="Definition">
                            {column.comment}
                        </KeyContentDisplay>
                    )}
                    <KeyContentDisplay keyString="Description">
                        {descriptionContent}
                    </KeyContentDisplay>
                    {!!column?.stats?.length && (
                        <DataTableColumnStats stats={column.stats} />
                    )}
                </div>
            </Card>
        </div>
    );
};
