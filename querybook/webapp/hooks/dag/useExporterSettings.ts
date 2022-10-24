import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IDataDocDAGExportMeta } from 'const/datadoc';
import { fetchDAGExporters, selectDAGExporter } from 'redux/dataDoc/action';
import { IStoreState } from 'redux/store/types';
import { updateValue } from 'ui/SmartForm/formFunctions';

interface IUseExporterSettingsProps {
    docId: number;
    savedMeta: IDataDocDAGExportMeta;
}

function useExporterDataByName() {
    const dispatch = useDispatch();
    const currentEnvironmentId = useSelector(
        (state: IStoreState) => state.environment.currentEnvironmentId
    );
    const exporterDataByName = useSelector(
        (state: IStoreState) => state.dataDoc.dagExporterDataByName
    );
    const exporterNames = React.useMemo(
        () => Object.keys(exporterDataByName || {}),
        [exporterDataByName]
    );
    React.useEffect(() => {
        if (exporterNames.length === 0) {
            dispatch(fetchDAGExporters(currentEnvironmentId));
        }
    }, [currentEnvironmentId, dispatch, exporterNames.length]);

    return { exporterDataByName, exporterNames };
}

export function useCurrentExporter(docId: number) {
    const { exporterDataByName } = useExporterDataByName();
    const selectedExporter = useSelector(
        (state: IStoreState) =>
            state.dataDoc.dagExportByDocId[docId]?.selectedExporter
    );
    return exporterDataByName[selectedExporter];
}

export function useExporterSettings({
    docId,
    savedMeta,
}: IUseExporterSettingsProps) {
    const dispatch = useDispatch();
    const { exporterDataByName, exporterNames } = useExporterDataByName();

    const selectedExporter = useSelector(
        (state: IStoreState) =>
            state.dataDoc.dagExportByDocId[docId]?.selectedExporter
    );

    const setSelectedExporter = useCallback(
        (name: string) => dispatch(selectDAGExporter(docId, name)),
        [dispatch, docId]
    );

    const [settingValues, setSettingValues] = React.useState<
        Record<string, any>
    >({});

    const exporterEngines = exporterDataByName[selectedExporter]?.engines;
    const exporterMeta = exporterDataByName[selectedExporter]?.meta;

    const useTemplatedVariables = Boolean(savedMeta.useTemplatedVariables);

    const handleSettingValuesChange = React.useCallback((key, value) => {
        setSettingValues((currVals) => updateValue(currVals, key, value));
    }, []);

    React.useEffect(() => {
        if (selectedExporter) {
            return;
        }
        if (savedMeta.exporter_meta) {
            setSelectedExporter(Object.keys(savedMeta.exporter_meta)?.[0]);
        } else if (exporterNames.length) {
            setSelectedExporter(exporterNames[0]);
        }
    }, [exporterNames, selectedExporter, savedMeta, setSelectedExporter]);

    React.useEffect(() => {
        if (savedMeta.exporter_meta?.[selectedExporter]) {
            setSettingValues(savedMeta.exporter_meta[selectedExporter]);
        }
    }, [savedMeta, selectedExporter]);

    return {
        exporterNames,
        selectedExporter,
        setSelectedExporter,
        settingValues,
        exporterEngines,
        exporterMeta,
        handleSettingValuesChange,
        useTemplatedVariables,
    };
}
