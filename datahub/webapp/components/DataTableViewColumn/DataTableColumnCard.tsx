import * as React from 'react';
import { ContentState } from 'draft-js';

import { IDataColumn } from 'const/metastore';

import { Card } from 'ui/Card/Card';
import { Divider } from 'ui/Divider/Divider';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';
import { Title } from 'ui/Title/Title';

import './DataTableColumnCard.scss';

interface IProps {
    column: IDataColumn;
    updateDataColumnDescription: (
        columnId: number,
        description: ContentState
    ) => any;
}

export const DataTableColumnCard: React.FunctionComponent<IProps> = ({
    column,
    updateDataColumnDescription,
}) => {
    const [expanded, setExpanded] = React.useState<boolean>(false);
    return (
        <div className="DataTableColumnCard">
            <Card key={column.id} alignLeft>
                <div
                    className="DataTableColumnCard-top"
                    onClick={() => setExpanded(!expanded)}
                    title={expanded ? 'click to minimize' : 'click to expand'}
                >
                    <Title size={5}>{column.name}</Title>
                    <div className="ml8">{column.type}</div>
                </div>
                {expanded ? (
                    <>
                        <Divider
                            marginTop="8px"
                            marginBottom="16px"
                            color="var(--color-primary-5)"
                        />
                        <div className="DataTableColumnCard-item">
                            <div className="DataTableColumnCard-key">
                                Definition
                            </div>
                            <div className="DataTableColumnCard-content">
                                {column.comment}
                            </div>
                        </div>
                        <div className="DataTableColumnCard-item">
                            <div className="DataTableColumnCard-key">
                                User Comments
                            </div>
                            <div className="DataTableColumnCard-content">
                                <EditableTextField
                                    value={column.description as ContentState}
                                    onSave={updateDataColumnDescription.bind(
                                        null,
                                        column.id
                                    )}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <span className="DataTableColumnCard-preview">
                        {(column.description as ContentState).getPlainText()
                            .length < 100
                            ? (column.description as ContentState).getPlainText()
                            : (column.description as ContentState)
                                  .getPlainText()
                                  .substring(0, 100)
                                  .concat('...')}
                    </span>
                )}
            </Card>
        </div>
    );
};
