import React from 'react';
import { useDrag } from 'react-dnd';

import { IDataQueryCell } from 'const/datadoc';
import { IQueryEngine } from 'const/queryEngine';
import history from 'lib/router-history';
import NOOP from 'lib/utils/noop';
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

export const DataDocDAGExporterListItem: React.FunctionComponent<IDataDocDAGExporterListItemProps> = React.memo(
    ({ queryCell, queryEngineById, className, url, onRemove }) => {
        const [, drag] = useDrag({
            item: {
                type: queryCellDraggableType,
                itemInfo: queryCell,
            },
        });

        const handleClick = React.useCallback(() => {
            history.push(url);
        }, [url]);

        const handleRemoveDataDoc = React.useCallback(
            (event: React.MouseEvent) => {
                if (onRemove) {
                    event.stopPropagation();
                    event.preventDefault();
                    onRemove(queryCell);
                }
            },
            [onRemove, queryCell]
        );

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
                                {statements.map((statement: string, idx) => (
                                    <StyledText
                                        weight="bold"
                                        color="light"
                                        key={statement}
                                        className={
                                            idx + 1 === statements.length
                                                ? ''
                                                : 'mr4'
                                        }
                                    >
                                        {statement.toLocaleUpperCase()}
                                        {idx + 1 === statements.length
                                            ? ''
                                            : ','}
                                    </StyledText>
                                ))}
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
