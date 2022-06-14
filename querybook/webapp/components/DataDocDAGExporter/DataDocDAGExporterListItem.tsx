import React from 'react';
import { useDrag } from 'react-dnd';

import NOOP from 'lib/utils/noop';
import { IDataQueryCell } from 'const/datadoc';
import { IQueryEngine } from 'const/queryEngine';
import { getQueryKeywords } from 'lib/sql-helper/sql-lexer';
import { generateFormattedDate } from 'lib/utils/datetime';

import { Tag } from 'ui/Tag/Tag';
import { Popover } from 'ui/Popover/Popover';
import { PopoverHoverWrapper } from 'ui/Popover/PopoverHoverWrapper';
import { AccentText, StyledText } from 'ui/StyledText/StyledText';
import { ThemedCodeHighlight } from 'ui/CodeHighlight/ThemedCodeHighlight';

import { queryCellDraggableType } from './DataDocDAGExporter';

export interface IDataDocDAGExporterListItemProps {
    queryCell: IDataQueryCell;
    queryEngineById: Record<number, IQueryEngine>;
}

export const DataDocDAGExporterListItem = React.memo<IDataDocDAGExporterListItemProps>(
    ({ queryCell, queryEngineById }) => {
        const [, drag] = useDrag({
            type: queryCellDraggableType,
            item: {
                itemInfo: queryCell,
            },
        });

        // TODO: use parser to get statements
        const statements = React.useMemo(
            () => getQueryKeywords(queryCell.context),
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
                                {queryCell.meta.title ? (
                                    <AccentText>
                                        {queryCell.meta.title}
                                    </AccentText>
                                ) : (
                                    <StyledText untitled>
                                        Untitled Cell {queryCell.id}
                                    </StyledText>
                                )}
                            </div>
                            <div className="DataDocDagExporterListItem-statements flex-row">
                                <StyledText weight="bold" color="light">
                                    {statements
                                        .map((statement: string) =>
                                            statement.toLocaleUpperCase()
                                        )
                                        .join(', ')}
                                </StyledText>
                            </div>
                            {showPopover && anchorElement && (
                                <Popover
                                    onHide={NOOP}
                                    anchor={anchorElement}
                                    layout={['right', 'top']}
                                >
                                    <ThemedCodeHighlight
                                        value={queryCell.context}
                                    />
                                </Popover>
                            )}
                        </>
                    )}
                </PopoverHoverWrapper>
            </div>
        );
    }
);
