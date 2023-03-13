import { ContentState } from 'draft-js';
import React, { useMemo } from 'react';

import { DataElement } from 'components/DataElement/DataElement';
import { DataElementDescription } from 'components/DataElement/DataElementDescription';
import { DataTableColumnStats } from 'components/DataTableStats/DataTableColumnStats';
import { TableTag } from 'components/DataTableTags/DataTableTags';
import { IDataColumn } from 'const/metastore';
import { useResource } from 'hooks/useResource';
import { useToggleState } from 'hooks/useToggleState';
import { Nullable } from 'lib/typescript';
import { parseType } from 'lib/utils/complex-types';
import { DataElementResource, TableColumnResource } from 'resource/table';
import { Card } from 'ui/Card/Card';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';
import { Icon } from 'ui/Icon/Icon';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';
import { AccentText, StyledText } from 'ui/StyledText/StyledText';

import { DataTableColumnCardNestedType } from './DataTableColumnCardNestedType';

import './DataTableColumnCard.scss';

interface IProps {
    column: IDataColumn;
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
    const { data: columnTags } = useResource(
        React.useCallback(
            () => TableColumnResource.getTags(column.id),
            [column.id]
        )
    );
    const { data: dataElementAssociation } = useResource(
        React.useCallback(
            () => DataElementResource.getDataElementByColumnId(column.id),
            [column.id]
        )
    );
    const [expanded, , toggleExpanded] = useToggleState(true);
    const parsedType = useMemo(() => parseType('', column.type), [column.type]);

    const tagsDOM = (columnTags || []).map((tag) => (
        <TableTag tag={tag} readonly={true} key={tag.id} mini={true} />
    ));

    const descriptionContent = (
        <div>
            {dataElementAssociation &&
                !(column.description as ContentState).hasText() && (
                    <DataElementDescription
                        dataElementAssociation={dataElementAssociation}
                    />
                )}
            <EditableTextField
                value={column.description as ContentState}
                onSave={updateDataColumnDescription.bind(null, column.id)}
                placeholder="add column description"
                onEditRedirect={onEditColumnDescriptionRedirect}
            />
        </div>
    );
    return (
        <div className="DataTableColumnCard">
            <Card key={column.id} alignLeft>
                <div
                    className="DataTableColumnCard-top horizontal-space-between"
                    onClick={() => toggleExpanded()}
                    aria-label={
                        expanded ? 'click to collapse' : 'click to expand'
                    }
                    data-balloon-pos="down-right"
                >
                    <div className="DataTableColumnCard-left">
                        <StyledText color="light" className="column-type mr12">
                            {column.type}
                        </StyledText>
                        <AccentText weight="extra">{column.name}</AccentText>
                    </div>
                    <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} />
                </div>
                {expanded ? (
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
                        {dataElementAssociation && (
                            <KeyContentDisplay keyString="Data Element">
                                <DataElement
                                    association={dataElementAssociation}
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
                        <DataTableColumnStats columnId={column.id} />
                    </div>
                ) : (
                    <div className="DataTableColumnCard-preview">
                        {(column.description as ContentState).getPlainText()}
                    </div>
                )}
            </Card>
        </div>
    );
};
