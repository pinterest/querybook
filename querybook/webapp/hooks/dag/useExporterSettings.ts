import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchDAGExporters } from 'redux/dataDoc/action';
import { IStoreState } from 'redux/store/types';

import { updateValue } from 'ui/SmartForm/formFunctions';

interface IProps {
    savedMeta: Record<string, any>;
}

export function useExporterSettings({ savedMeta }: IProps) {
    const dispatch = useDispatch();

    const exporterDataByName = useSelector(
        (state: IStoreState) => state.dataDoc.dagExporterDataByName
    );

    const [selectedExporter, setSelectedExporter] = React.useState<string>();
    const [settingValues, setSettingValues] = React.useState<
        Record<string, any>
    >({});

    const exporterNames = React.useMemo(
        () => Object.keys(exporterDataByName || {}),
        [exporterDataByName]
    );

    const exporterMeta = exporterDataByName[selectedExporter]?.meta;

    const handleSettingValuesChange = React.useCallback((key, value) => {
        setSettingValues((currVals) => updateValue(currVals, key, value));
    }, []);

    React.useEffect(() => {
        if (exporterNames.length === 0) {
            dispatch(fetchDAGExporters());
        }
    }, [dispatch]);

    React.useEffect(() => {
        if (selectedExporter) {
            return;
        }
        if (Object.keys(savedMeta).length) {
            setSelectedExporter(Object.keys(savedMeta)?.[0]);
        } else if (exporterNames.length) {
            setSelectedExporter(exporterNames[0]);
        }
    }, [exporterNames, selectedExporter, savedMeta]);

    React.useEffect(() => {
        if (savedMeta[selectedExporter]) {
            setSettingValues(savedMeta[selectedExporter]);
        }
    }, [savedMeta, selectedExporter]);

    return {
        exporterNames,
        selectedExporter,
        setSelectedExporter,
        settingValues,
        exporterMeta,
        handleSettingValuesChange,
    };
}
