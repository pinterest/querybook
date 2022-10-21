import React from 'react';
import { Edge, Node } from 'react-flow-renderer';
import { useDispatch, useSelector } from 'react-redux';

import { hashString } from 'lib/data-doc/data-doc-utils';
import { fetchDAGExport, saveDAGExport } from 'redux/dataDoc/action';
import { Dispatch, IStoreState } from 'redux/store/types';

export function useSavedDAG(docId: number) {
    const dispatch: Dispatch = useDispatch();

    const savedDAGExport = useSelector(
        (state: IStoreState) =>
            state.dataDoc.dagExportByDocId[docId]?.savedDAGExport
    );

    React.useEffect(() => {
        dispatch(fetchDAGExport(docId));
    }, [dispatch, docId]);

    const savedNodes = React.useMemo(
        () => (savedDAGExport?.dag?.nodes || []) as Node[],
        [savedDAGExport]
    );
    const savedEdges = React.useMemo(
        () => (savedDAGExport?.dag?.edges || []) as Edge[],
        [savedDAGExport]
    );
    const savedMeta = React.useMemo(
        () => savedDAGExport?.meta || {},
        [savedDAGExport]
    );

    const onSave = React.useCallback(
        (
            nodes: Node[],
            edges: Edge[],
            exporterMeta?: Record<string, any>,
            useTemplatedVariables?: boolean
        ) => {
            const processedNodes = nodes.map((node) => ({
                id: node.id,
                position: node.position,
                data: {
                    queryHash: hashString(node.data.queryCell.context),
                },
                sourcePosition: node.sourcePosition,
                targetPosition: node.targetPosition,
            }));
            const meta = {
                ...savedMeta,
            };
            if (exporterMeta) {
                meta.exporter_meta = exporterMeta;
            }
            if (useTemplatedVariables != null) {
                meta.useTemplatedVariables = useTemplatedVariables;
            }
            return dispatch(saveDAGExport(docId, processedNodes, edges, meta));
        },
        [dispatch, docId, savedMeta]
    );

    return { onSave, savedNodes, savedEdges, savedMeta };
}
