import { useSelector, useDispatch } from 'react-redux';
import history from 'lib/router-history';

import { createDataDoc } from 'redux/dataDoc/action';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { queryEngineSelector } from 'redux/queryEngine/selector';
import { getQueryEngineId } from 'lib/utils';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

export function useCreateDataDoc(withTour = false) {
    const environment = useSelector(currentEnvironmentSelector);
    const queryEngines = useSelector(queryEngineSelector);
    const defaultEngineId = useSelector((state: IStoreState) =>
        getQueryEngineId(
            state.user.computedSettings['default_query_engine'],
            queryEngines.map(({ id }) => id)
        )
    );
    const dispatch: Dispatch = useDispatch();
    return useCallback(() => {
        if (defaultEngineId == null) {
            toast.error(
                'Cannot create a DataDoc because the environment has no query engine.'
            );
            return;
        }

        const cell = {
            type: 'query',
            context: '',
            meta: { engine: defaultEngineId },
        };
        dispatch(createDataDoc([cell])).then((dataDoc) =>
            history.push(
                `/${environment.name}/datadoc/${dataDoc.id}/${
                    withTour ? '?tour=true' : ''
                }`
            )
        );
    }, [environment, defaultEngineId]);
}
