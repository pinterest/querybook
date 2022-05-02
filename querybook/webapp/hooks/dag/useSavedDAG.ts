import React from 'react';
import { Edge, Node } from 'react-flow-renderer';
import { useDispatch } from 'react-redux';

import { fetchDAGExport, saveDAGExport } from 'redux/dataDoc/action';
import { IStoreState } from 'redux/store/types';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';

export function useSavedDAG(docId: number) {
    const dispatch = useDispatch();

    const savedDAGExport = useShallowSelector(
        (state: IStoreState) => state.dataDoc.dagExportByDocId[docId]
    );

    React.useEffect(() => {
        dispatch(fetchDAGExport(docId));
    }, [dispatch, docId]);

    const onSave = React.useCallback(
        async (nodes: Node[], edges: Edge[]) => {
            dispatch(saveDAGExport(docId, nodes, edges));
        },
        [dispatch, docId]
    );

    const savedNodes = React.useMemo(
        () => (savedDAGExport?.dag?.nodes || []) as Node[],
        [savedDAGExport]
    );
    const savedEdges = React.useMemo(
        () => (savedDAGExport?.dag?.edges || []) as Edge[],
        [savedDAGExport]
    );

    return { onSave, savedNodes, savedEdges };
}
