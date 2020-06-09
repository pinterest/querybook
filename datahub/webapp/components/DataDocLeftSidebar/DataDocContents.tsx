import React, { useMemo } from 'react';

import { scrollToCell } from 'lib/data-doc/data-doc-utils';
import { IDataCell } from 'const/datadoc';
import { Icon } from 'ui/Icon/Icon';
import { DraggableList } from 'ui/DraggableList/DraggableList';
import { moveDataDocCell } from 'redux/dataDoc/action';

const CELL_TEXT_LEN = 50;

export const DataDocContents: React.FunctionComponent<{
    docId: number;
    cells: IDataCell[];
}> = ({ cells, docId }) => {
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
    return (
        <DraggableList
            items={cells}
            className="contents-panel-cell-rows"
            onMove={(from, to) => moveDataDocCell(docId, from, to)}
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
                            <i>{`(Empty Text #${cellIdToIndex[cell.id]})`}</i>
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
    );
};
