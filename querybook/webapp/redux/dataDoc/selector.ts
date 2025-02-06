import { createSelector } from 'reselect';

import { IDataCell, IDataQueryCellMeta } from 'const/datadoc';
import {
    editorToPermission,
    getViewerInfo,
    permissionToReadWrite,
    sortViewersInfo,
} from 'lib/data-doc/datadoc-permission';
import { IStoreState } from 'redux/store/types';
import { myUserInfoSelector } from 'redux/user/selector';

const dataDocByIdSelector = (state: IStoreState) => state.dataDoc.dataDocById;
const dataDocCellByIdSelector = (state: IStoreState) =>
    state.dataDoc.dataDocCellById;
const currentEnvironmentIdSelector = (state: IStoreState) =>
    state.environment.currentEnvironmentId;

const editorsByDocIdUserIdSelector = (state: IStoreState) =>
    state.dataDoc.editorsByDocIdUserId;
const accessRequestsByDocIdUserIdSelector = (state: IStoreState) =>
    state.dataDoc.accessRequestsByDocIdUserId;
const sessionByDocIdSelector = (state: IStoreState) =>
    state.dataDoc.sessionByDocId;
const favoriteDataDocIdsSelector = (state: IStoreState) =>
    state.dataDoc.favoriteDataDocIds;
const recentDataDocIdsSelector = (state: IStoreState) =>
    state.dataDoc.recentDataDocIds;

const dataDocInEnvironmentSelector = createSelector(
    dataDocByIdSelector,
    currentEnvironmentIdSelector,
    (dataDocById, envId) =>
        Object.values(dataDocById).filter(
            (dataDoc) => dataDoc.environment_id === envId
        )
);

export function cellIdsToCells(
    cellIds: number[] = [],
    dataDocCellById: Record<number, IDataCell>
) {
    return cellIds.map((cellId) => dataDocCellById[cellId]);
}

export const dataDocsOrderedSelector = createSelector(
    dataDocInEnvironmentSelector,
    // sort id by descending
    (dataDocs) => dataDocs.sort((a, b) => b.updated_at - a.updated_at)
);

export const dataDocsMineSelector = createSelector(
    dataDocsOrderedSelector,
    myUserInfoSelector,
    (dataDocs, myUserInfo) =>
        dataDocs.filter(
            (dataDoc) =>
                dataDoc.owner_uid === myUserInfo.id && !dataDoc.archived
        )
);

export const favoriteDataDocsSelector = createSelector(
    dataDocByIdSelector,
    currentEnvironmentIdSelector,
    favoriteDataDocIdsSelector,
    (dataDocById, envId, ids) =>
        ids.reduce((arr, id) => {
            if (id in dataDocById && dataDocById[id].environment_id === envId) {
                arr.push(dataDocById[id]);
            }
            return arr;
        }, [])
);

export const recentDataDocsSelector = createSelector(
    dataDocByIdSelector,
    currentEnvironmentIdSelector,
    recentDataDocIdsSelector,
    (dataDocById, envId, ids) =>
        ids.slice(0, 5).reduce((arr, id) => {
            if (id in dataDocById && dataDocById[id].environment_id === envId) {
                arr.push(dataDocById[id]);
            }
            return arr;
        }, [])
);

const currentDataDocSelector = (state: IStoreState, docId: number) =>
    state.dataDoc.dataDocById[docId];

const dataDocCellsSelector = createSelector(
    currentDataDocSelector,
    dataDocCellByIdSelector,
    (dataDoc, dataDocCellById) =>
        dataDoc ? cellIdsToCells(dataDoc.cells, dataDocCellById) : []
);

export const dataDocSelector = createSelector(
    currentDataDocSelector,
    dataDocCellsSelector,
    (dataDoc, dataDocCells) =>
        dataDoc
            ? {
                  ...dataDoc,
                  dataDocCells,
              }
            : null
);

export const dataDocEditorByUidSelector = createSelector(
    currentDataDocSelector,
    editorsByDocIdUserIdSelector,
    (dataDoc, editorsByDocIdUserId) =>
        dataDoc && dataDoc.id in editorsByDocIdUserId
            ? editorsByDocIdUserId[dataDoc.id]
            : {}
);

export const currentDataDocAccessRequestsByUidSelector = createSelector(
    currentDataDocSelector,
    accessRequestsByDocIdUserIdSelector,
    (dataDoc, accessRequestsByDocIdUserId) =>
        dataDoc && dataDoc.id in accessRequestsByDocIdUserId
            ? accessRequestsByDocIdUserId[dataDoc.id]
            : {}
);

export const dataDocViewerIdsSelector = createSelector(
    currentDataDocSelector,
    sessionByDocIdSelector,
    (dataDoc, sessionByDocId) =>
        dataDoc && dataDoc.id in sessionByDocId
            ? [
                  ...new Set(
                      Object.values(sessionByDocId[dataDoc.id]).map(
                          ({ uid }) => uid
                      )
                  ),
              ]
            : []
);

export const makeDataDocCursorByCellIdSelector = () =>
    createSelector(
        currentDataDocSelector,
        sessionByDocIdSelector,
        (dataDoc, sessionByDocId) =>
            dataDoc && dataDoc.id in sessionByDocId
                ? (Object.entries(sessionByDocId[dataDoc.id]).reduce(
                      (hash, [sid, { cellId, uid }]) => {
                          if (cellId != null) {
                              hash[cellId] = hash[cellId] || [];
                              if (!hash[cellId].includes(uid)) {
                                  hash[cellId].push(uid);
                              }
                          }
                          return hash;
                      },
                      {}
                  ) as Record<number, number[]>)
                : {}
    );

export const dataDocViewerInfosSelector = createSelector(
    dataDocSelector,
    dataDocEditorByUidSelector,
    dataDocViewerIdsSelector,
    (state: IStoreState) => state.user.myUserInfo.uid,
    (dataDoc, editorsByUserId, viewerIds, uid) => {
        const nonGroupEditorsByUserId = Object.fromEntries(
            Object.entries(editorsByUserId).filter(
                // Filter out any editors inherited from groups
                // (i.e. editors with a uid but no id)
                ([_userId, editor]) => editor.id !== null || editor.uid === uid
            )
        );
        const allUserIds = [
            ...new Set(
                [dataDoc.owner_uid]
                    .concat(viewerIds)
                    .concat(Object.keys(nonGroupEditorsByUserId).map(Number))
            ),
        ];
        const nonExplicitEditorPermissions = {};
        for (const viewerId of viewerIds) {
            nonExplicitEditorPermissions[viewerId] = editorsByUserId[viewerId];
        }
        return sortViewersInfo(
            allUserIds.map((uid) =>
                getViewerInfo(
                    uid,
                    nonGroupEditorsByUserId,
                    dataDoc,
                    viewerIds,
                    nonExplicitEditorPermissions
                )
            )
        );
    }
);

export const canCurrentUserEditSelector = createSelector(
    dataDocSelector,
    dataDocEditorByUidSelector,
    (state: IStoreState) => state.user.myUserInfo.uid,
    (dataDoc, editorsByUserId, uid) => {
        if (!dataDoc) {
            return false;
        }
        const editor = editorsByUserId[uid];
        const permission = editorToPermission(
            dataDoc.owner_uid === uid,
            editor
        );
        return permissionToReadWrite(permission).write;
    }
);

export const queryCellSelector = createSelector(dataDocCellsSelector, (cells) =>
    cells
        .filter((cell) => cell.cell_type === 'query')
        .map((cell, index) => {
            const cellMeta: IDataQueryCellMeta = cell.meta;
            const title = cellMeta.title || `Query #${index + 1}`;
            return {
                id: cell.id,
                title,
            };
        })
);
