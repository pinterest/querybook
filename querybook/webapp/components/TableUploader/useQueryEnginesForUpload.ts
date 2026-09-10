import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { queryEngineSelector } from 'redux/queryEngine/selector';
import { IStoreState } from 'redux/store/types';

export function useQueryEnginesForUpload(metastoreId?: number) {
    const queryEngines = useSelector(queryEngineSelector);
    return useMemo(() => {
        const filtered = queryEngines.filter(
            (engine) =>
                engine.metastore_id === metastoreId &&
                engine.feature_params.upload_exporter
        );
        // Sort to put PyIcebergExporter first (as default)
        return filtered.sort((a, b) => {
            const aExporter = a.feature_params.upload_exporter;
            const bExporter = b.feature_params.upload_exporter;
            if (
                aExporter === 'PyIcebergExporter' &&
                bExporter !== 'PyIcebergExporter'
            )
                return -1;
            if (
                aExporter !== 'PyIcebergExporter' &&
                bExporter === 'PyIcebergExporter'
            )
                return 1;
            return 0;
        });
    }, [queryEngines, metastoreId]);
}

export function useMetastoresForUpload() {
    const queryEngines = useSelector(queryEngineSelector);
    const availableForUploadMetaStoreIds = useMemo(
        () =>
            new Set(
                queryEngines
                    .filter((engine) => engine.feature_params.upload_exporter)
                    .map((engine) => engine.metastore_id)
                    .filter((metastoreId) => metastoreId != null)
            ),
        [queryEngines]
    );
    const metastoreById = useSelector(
        (state: IStoreState) => state.dataSources.queryMetastoreById
    );
    return useMemo(
        () =>
            [...availableForUploadMetaStoreIds].map((id) => metastoreById[id]),
        [availableForUploadMetaStoreIds, metastoreById]
    );
}
