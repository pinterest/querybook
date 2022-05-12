import React from 'react';
import { Edge, Node } from 'react-flow-renderer';
import { useDispatch, useSelector } from 'react-redux';

import { fetchDAGExport, saveDAGExport } from 'redux/dataDoc/action';
import { Dispatch, IStoreState } from 'redux/store/types';

export function useSavedDAG(docId: number) {
    const dispatch: Dispatch = useDispatch();

    const savedDAGExport = useSelector(
        (state: IStoreState) => state.dataDoc.dagExportByDocId[docId]
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
    const savedMeta = React.useMemo(() => savedDAGExport?.meta || {}, [
        savedDAGExport,
    ]);

    const onSave = React.useCallback(
        (nodes: Node[], edges: Edge[], meta?: Record<string, any>) =>
            dispatch(saveDAGExport(docId, nodes, edges, meta)),
        [dispatch, docId]
    );

    return { onSave, savedNodes, savedEdges, savedMeta };
}
