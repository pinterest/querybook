import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchDataDocIfNeeded } from 'redux/dataDoc/action';
import { IStoreState } from 'redux/store/types';

/**
 * Provide getter for fetching and displaying a DataDoc, recommended to use with Loader
 *
 * @param docId the id of a dataDoc
 */
export function useDataDoc(docId: number) {
    const dataDoc = useSelector(
        (state: IStoreState) => state.dataDoc.dataDocById[docId]
    );

    const dispatch = useDispatch();
    const getDataDoc = useCallback(
        () => dispatch(fetchDataDocIfNeeded(docId)),
        [docId, dispatch]
    );

    return {
        getDataDoc,

        dataDoc,
    };
}
