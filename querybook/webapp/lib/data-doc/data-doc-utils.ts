import { IDataCell } from 'const/datadoc';
import { ContentState } from 'draft-js';
import scrollIntoView from 'smooth-scroll-into-view-if-needed';

export async function scrollToCell(
    cellId: number,
    duration: number = 200,
    repeat: number = 1
) {
    if (cellId == null) {
        return;
    }

    const anchorName = getAnchorNameForCell(cellId);
    const element = document.getElementById(anchorName);
    for (let i = 0; i < repeat; i++) {
        await scrollIntoView(element, {
            behavior: 'smooth',
            scrollMode: 'if-needed',
            block: 'start',

            duration,
        });
    }
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

// from: https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/

export const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        // eslint-disable-next-line no-bitwise
        hash = (hash << 5) - hash + char;
        hash = hash && hash; // Convert to 32bit integer
    }
    return hash;
};

export function isCellEmpty(cell: IDataCell): boolean {
    const cellType = cell.cell_type;
    if (cellType === 'query') {
        return cell.context === '';
    } else if (cellType === 'text') {
        return !(cell.context as ContentState).hasText();
    }

    return false;
}
