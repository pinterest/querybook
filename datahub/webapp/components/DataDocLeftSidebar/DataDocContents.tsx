import React from 'react';

import { scrollToCell } from 'lib/data-doc/data-doc-utils';
import { IDataCell } from 'const/datadoc';
import { Icon } from 'ui/Icon/Icon';

const CELL_TEXT_LEN = 50;

export const DataDocContents: React.FunctionComponent<{
    cells: IDataCell[];
}> = ({ cells }) => {
    const cellTypeCount = {};
    const cellsDOM = cells.map((cell) => {
        let cellText: React.ReactChild = ' ';
        let cellIcon: React.ReactChild = null;

        cellTypeCount[cell.cell_type] =
            (cellTypeCount[cell.cell_type] || 0) + 1;
        switch (cell.cell_type) {
            case 'query': {
                const cellTitle =
                    cell.meta['title'] ||
                    `Query #${cellTypeCount[cell.cell_type]}`;
                const cellQueryText = cell.context.slice(
                    0,
                    50 - cellTitle.length
                );

                cellText = (
                    <>
                        <b className="mr4">{cellTitle}</b>
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
                    <i>{`(Empty Text #${cellTypeCount[cell.cell_type]})`}</i>
                );

                cellIcon = <Icon name="type" size={19} />;

                break;
            }
            case 'chart': {
                cellIcon = <Icon name="pie-chart" size={19} />;
                cellText = (
                    <b>
                        {cell.meta['title'] ||
                            `Chart #${cellTypeCount[cell.cell_type]}`}
                    </b>
                );
                break;
            }
        }

        return (
            <li
                key={cell.id}
                className="contents-panel-cell-row"
                onClick={() => scrollToCell(cell.id)}
            >
                {cellIcon}
                <span className="contents-panel-cell-row-text">{cellText}</span>
            </li>
        );
    });
    return <ul className="contents-panel-cell-rows">{cellsDOM}</ul>;
};
