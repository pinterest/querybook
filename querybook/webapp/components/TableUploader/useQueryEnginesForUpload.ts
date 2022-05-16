import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { queryEngineSelector } from 'redux/queryEngine/selector';

export function useQueryEnginesForUpload(metastoreId: number) {
    const queryEngines = useSelector(queryEngineSelector);
    return useMemo(
        () =>
            queryEngines.filter(
                (engine) =>
                    engine.metastore_id === metastoreId &&
                    engine.feature_params.upload_exporter
            ),
        [queryEngines, metastoreId]
    );
}
