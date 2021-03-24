import React, { useCallback, useMemo, useRef } from 'react';

import { scrollToCell } from 'lib/data-doc/data-doc-utils';
import { IDataCell } from 'const/datadoc';
import { Icon } from 'ui/Icon/Icon';
import { DraggableList } from 'ui/DraggableList/DraggableList';
import { moveDataDocCell } from 'redux/dataDoc/action';
import { getScrollParent } from 'lib/utils';

import './DataDocContents.scss';

const CELL_TEXT_LEN = 50;

export const DataDocContents: React.FC<{
    docId: number;
    cells: IDataCell[];
}> = React.memo(({ cells, docId }) => {
    const selfRef = useRef<HTMLDivElement>(null);
    const cellIdToIndex = useMemo(() => {
        const ret = {};
        const cellTypeCount = {};
        for (const cell of cells) {
            cellTypeCount[cell.cell_type] =
                (cellTypeCount[cell.cell_type] ?? 0) + 1;
            ret[cell.id] = cellTypeCount[cell.cell_type];
        }
        return ret;
    }, [cells]);

    const handleMoveCell = useCallback(
        async (from: number, to: number) => {
            await moveDataDocCell(docId, from, to);
            // This is to "nudge" the scroll bar of the data doc
            // to make sure lazy loaded cells gets loaded
            const scrollParent = getScrollParent(selfRef.current);
            scrollParent.scrollTo(
                scrollParent.scrollLeft,
                scrollParent.scrollTop + 1
            );
        },
        [docId]
    );

    return (
        <div className="DataDocContents" ref={selfRef}>
            <DraggableList
                items={cells}
                onMove={handleMoveCell}
                renderItem={(index, cell) => {
                    let cellText: React.ReactChild = ' ';
                    let cellIcon: React.ReactChild = null;

                    switch (cell.cell_type) {
                        case 'query': {
                            const cellTitle =
                                cell.meta['title'] ||
                                `Query #${cellIdToIndex[cell.id]}`;
                            const cellQueryText = cell.context.slice(
                                0,
                                50 - cellTitle.length
                            );

                            cellText = (
                                <>
                                    <b className="mr8">{cellTitle}</b>
                                    {cellQueryText}
                                </>
                            );
                            cellIcon = <Icon name="code" size={19} />;
                            break;
                        }
                        case 'text': {
                            cellText = cell.context
                                .getPlainText()
                                .trim()
                                .slice(0, CELL_TEXT_LEN) || (
                                <i>{`(Empty Text #${
                                    cellIdToIndex[cell.id]
                                })`}</i>
                            );

                            cellIcon = <Icon name="type" size={19} />;

                            break;
                        }
                        case 'chart': {
                            cellIcon = <Icon name="pie-chart" size={19} />;
                            cellText = (
                                <b>
                                    {cell.meta['title'] ||
                                        `Chart #${cellIdToIndex[cell.id]}`}
                                </b>
                            );
                            break;
                        }
                    }

                    return (
                        <div
                            className="contents-panel-cell-row"
                            onClick={() => scrollToCell(cell.id)}
                        >
                            {cellIcon}
                            <span className="contents-panel-cell-row-text">
                                {cellText}
                            </span>
                        </div>
                    );
                }}
            />
        </div>
    );
});
