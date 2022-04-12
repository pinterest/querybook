import React from 'react';
import { useDrag } from 'react-dnd';

import NOOP from 'lib/utils/noop';
import { IDataQueryCell } from 'const/datadoc';
import { IQueryEngine } from 'const/queryEngine';
import { getQueryStatements } from 'lib/sql-helper/sql-formatter';
import { generateFormattedDate } from 'lib/utils/datetime';

import { queryCellDraggableType } from './DataDocDAGExporter';

import { Tag } from 'ui/Tag/Tag';
import { Popover } from 'ui/Popover/Popover';
import { PopoverHoverWrapper } from 'ui/Popover/PopoverHoverWrapper';
import { AccentText, StyledText } from 'ui/StyledText/StyledText';

export interface IDataDocDAGExporterListItemProps {
    queryCell: IDataQueryCell;
    queryEngineById: Record<number, IQueryEngine>;
    className?: string;
    pinned?: boolean;
    url?: string;
    onRemove?: (queryCell: IDataQueryCell) => any;
}

export const DataDocDAGExporterListItem = React.memo<IDataDocDAGExporterListItemProps>(
    ({ queryCell, queryEngineById, className, url, onRemove }) => {
        const [, drag] = useDrag({
            item: {
                type: queryCellDraggableType,
                itemInfo: queryCell,
            },
        });

        const statements = React.useMemo(
            () => getQueryStatements(queryCell.context),
            [queryCell]
        );

        return (
            <div ref={drag} className="DataDocDAGExporterListItem mb12 p8">
                <PopoverHoverWrapper>
                    {(showPopover, anchorElement) => (
                        <>
                            <div className="horizontal-space-between mb4">
                                <StyledText size="small" color="light">
                                    {generateFormattedDate(
                                        queryCell.created_at
                                    )}
                                </StyledText>
                                <Tag mini light>
                                    {
                                        queryEngineById[queryCell.meta.engine]
                                            .name
                                    }
                                </Tag>
                            </div>
                            <div className="DataDocDagExporterListItem-title mb4">
                                <AccentText>{queryCell.meta.title}</AccentText>
                            </div>
                            <div className="DataDocDagExporterListItem-statements flex-row">
                                <StyledText weight="bold" color="light">
                                    {statements
                                        .map((statement: string) =>
                                            statement.toLocaleUpperCase()
                                        )
                                        .join(',')}
                                </StyledText>
                            </div>
                            {showPopover && anchorElement && (
                                <Popover
                                    onHide={NOOP}
                                    anchor={anchorElement}
                                    layout={['bottom', 'right']}
                                >
                                    <pre>{queryCell.context}</pre>
                                </Popover>
                            )}
                        </>
                    )}
                </PopoverHoverWrapper>
            </div>
        );
    }
);
