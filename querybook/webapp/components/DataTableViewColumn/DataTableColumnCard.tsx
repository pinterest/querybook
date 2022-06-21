import { ContentState } from 'draft-js';
import * as React from 'react';

import { DataTableColumnStats } from 'components/DataTableStats/DataTableColumnStats';
import { IDataColumn } from 'const/metastore';
import { Card } from 'ui/Card/Card';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';
import { Icon } from 'ui/Icon/Icon';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';
import { AccentText, StyledText } from 'ui/StyledText/StyledText';

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
                        <StyledText color="light" className="column-type mr12">
                            {column.type}
                        </StyledText>
                        <AccentText weight="extra">{column.name}</AccentText>
                    </div>
                    <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} />
                </div>
                {expanded ? (
                    <div className="mt16">
                        {column.comment && (
                            <KeyContentDisplay keyString="Definition">
                                {column.comment}
                            </KeyContentDisplay>
                        )}
                        <KeyContentDisplay keyString="User Comments">
                            {userCommentsContent}
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
