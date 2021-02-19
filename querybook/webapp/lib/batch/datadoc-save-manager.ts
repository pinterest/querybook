import type { ContentState } from 'draft-js';

import type { IDataCellMeta } from 'const/datadoc';
import ds from 'lib/datasource';
import { BatchManager, spreadMergeFunction } from 'lib/batch/batch-manager';
import dataDocSocket from 'lib/data-doc/datadoc-socketio';
import { convertIfContentStateToHTML } from 'lib/richtext/serialize';

export class DataDocSaveManager {
    private dataDocSaverByDocId: Record<
        number,
        BatchManager<Record<string, any>, Record<string, any>>
    > = {};

    public saveDataDocField(
        docId: number,
        field: string,
        value: any,
        frequency: number = 2000
    ) {
        if (!(docId in this.dataDocSaverByDocId)) {
            this.dataDocSaverByDocId[docId] = new BatchManager({
                processFunction: (fields) => {
                    if (dataDocSocket.activeDataDocId === docId) {
                        return dataDocSocket.updateDataDoc(docId, fields);
                    } else {
                        return ds.update(`/datadoc/${docId}/`, fields);
                    }
                },
                batchFrequency: frequency,
                mergeFunction: spreadMergeFunction,
            });
        }
        return this.dataDocSaverByDocId[docId].batch({
            [field]: value,
        });
    }

    public forceSaveDataDoc(docId: number) {
        if (docId in this.dataDocSaverByDocId) {
            this.dataDocSaverByDocId[docId].forceProcess();
            delete this.dataDocSaverByDocId[docId];
        }
    }
}

interface IUpdateDataCell {
    context?: string | ContentState;
    meta?: IDataCellMeta;
}

export class DataCellSaveManager {
    private itemSaverByCellId: Record<
        number,
        BatchManager<IUpdateDataCell, IUpdateDataCell>
    > = {};

    public saveDataCell(
        docId: number,
        cellId: number,
        context?: string | ContentState,
        meta?: IDataCellMeta,
        frequency: number = 2000
    ) {
        if (!(cellId in this.itemSaverByCellId)) {
            this.itemSaverByCellId[cellId] = new BatchManager({
                mergeFunction: spreadMergeFunction,
                processFunction: (data) => {
                    const stringifiedContext = convertIfContentStateToHTML(
                        data.context
                    );

                    const fields = {
                        ...(stringifiedContext != null && {
                            context: stringifiedContext,
                        }),
                        ...(data.meta != null && { meta: data.meta }),
                    };

                    if (dataDocSocket.activeDataDocId === docId) {
                        return dataDocSocket.updateDataCell(
                            docId,
                            cellId,
                            fields
                        );
                    } else {
                        return ds.update(`/data_cell/${cellId}/`, fields);
                    }
                },
                batchFrequency: frequency,
            });
        }

        return this.itemSaverByCellId[cellId].batch({
            ...(context != null && { context }),
            ...(meta && { meta }),
        });
    }

    public forceSaveDataCell(cellId: number) {
        if (cellId in this.itemSaverByCellId) {
            this.itemSaverByCellId[cellId].forceProcess();
            delete this.itemSaverByCellId[cellId];
        }
    }
}
