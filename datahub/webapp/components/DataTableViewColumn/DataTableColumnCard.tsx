import * as React from 'react';
import { ContentState } from 'draft-js';

import { IDataColumn } from 'const/metastore';

import { DataTableColumnStats } from '../DataTableStats/DataTableColumnStats';
import { Card } from 'ui/Card/Card';
import { Divider } from 'ui/Divider/Divider';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';
import { Icon } from 'ui/Icon/Icon';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';
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
    const [expanded, setExpanded] = React.useState(false);

    const userCommentsContent = (
        <EditableTextField
            value={column.description as ContentState}
            onSave={updateDataColumnDescription.bind(null, column.id)}
        />
    );
    return (
        <div className="DataTableColumnCard">
            <Card key={column.id} alignLeft>
                <div
                    className="DataTableColumnCard-top horizontal-space-between"
                    onClick={() => setExpanded(!expanded)}
                    aria-label={
                        expanded ? 'click to collapse' : 'click to expand'
                    }
                    data-balloon-pos="down-right"
                >
                    <div className="DataTableColumnCard-left">
                        <Title size={6}>{column.name}</Title>
                        <div className="ml8">{column.type}</div>
                    </div>
                    <Icon name={expanded ? 'chevron-up' : 'chevron-down'} />
                </div>
                {expanded ? (
                    <>
                        <Divider
                            marginTop="8px"
                            marginBottom="16px"
                            color="var(--color-primary-5)"
                        />
                        {column.comment && (
                            <KeyContentDisplay keyString="Definition">
                                {column.comment}
                            </KeyContentDisplay>
                        )}
                        <KeyContentDisplay keyString="User Comments">
                            {userCommentsContent}
                        </KeyContentDisplay>
                        <DataTableColumnStats columnId={column.id} />
                    </>
                ) : (
                    <div className="DataTableColumnCard-preview">
                        {(column.description as ContentState).getPlainText()}
                    </div>
                )}
            </Card>
        </div>
    );
};
