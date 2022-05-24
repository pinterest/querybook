import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IDataDocDAGExportMeta } from 'const/datadoc';
import { fetchDAGExporters } from 'redux/dataDoc/action';
import { IStoreState } from 'redux/store/types';
import { updateValue } from 'ui/SmartForm/formFunctions';

interface IProps {
    savedMeta: IDataDocDAGExportMeta;
}

function useExporterDataByName() {
    const dispatch = useDispatch();
    const exporterDataByName = useSelector(
        (state: IStoreState) => state.dataDoc.dagExporterDataByName
    );
    const exporterNames = React.useMemo(
        () => Object.keys(exporterDataByName || {}),
        [exporterDataByName]
    );
    React.useEffect(() => {
        if (exporterNames.length === 0) {
            dispatch(fetchDAGExporters());
        }
    }, [dispatch]);

    return { exporterDataByName, exporterNames };
}

export function useExporterSettings({ savedMeta }: IProps) {
    const { exporterDataByName, exporterNames } = useExporterDataByName();

    const [selectedExporter, setSelectedExporter] = React.useState<string>();
    const [settingValues, setSettingValues] = React.useState<
        Record<string, any>
    >({});

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
    }, [exporterNames, selectedExporter, savedMeta]);

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
        exporterMeta,
        handleSettingValuesChange,
        useTemplatedVariables,
    };
}
