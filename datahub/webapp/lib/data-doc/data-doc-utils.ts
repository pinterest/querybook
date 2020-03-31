import { IDataCell } from 'const/datadoc';
import { scrollToElement } from 'lib/utils';

export function scrollToCell(dataDocCell: IDataCell, duration: number = 200) {
    const anchorName = getAnchorNameForCell(dataDocCell.id);

    scrollToElement(document.getElementById(anchorName), duration).then(() => {
        location.hash = '';
        location.hash = anchorName;
    });
}

export function getAnchorNameForCell(cellKey: string | number) {
    return `dataCell${cellKey}`;
}
