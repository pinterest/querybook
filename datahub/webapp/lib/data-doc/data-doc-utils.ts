import { IDataCell } from 'const/datadoc';
import { scrollToElement } from 'lib/utils';

export async function scrollToCell(
    dataDocCell: IDataCell,
    duration: number = 200,
    repeat: number = 1
) {
    const anchorName = getAnchorNameForCell(dataDocCell.id);

    for (let i = 0; i < repeat; i++) {
        await scrollToElement(document.getElementById(anchorName), duration);
    }

    location.hash = '';
    location.hash = anchorName;
}

export function getAnchorNameForCell(cellKey: string | number) {
    return `dataCell${cellKey}`;
}

export function getShareUrl(
    cellId: number,
    executionId: number,
    relative = false
) {
    // Note: this only works when the doc is open
    const hostpart = relative ? '' : `${location.protocol}//${location.host}`;
    const executionParam =
        executionId != null ? `executionId=${executionId}` : null;
    const cellParam = cellId != null ? `cellId=${cellId}` : null;
    const params = [cellParam, executionParam].filter((p) => p).join('&');

    return `${hostpart}${location.pathname}?` + params;
}
