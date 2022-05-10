import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchDAGExporters } from 'redux/dataDoc/action';
import { IStoreState } from 'redux/store/types';

interface IProps {
    savedMeta: Record<string, any>;
}

export function useExporterSettings({ savedMeta }: IProps) {
    const dispatch = useDispatch();

    const exporterDataByName = useSelector(
        (state: IStoreState) => state.dataDoc.dagExporterDataByName
    );

    const [selectedExporter, setSelectedExporter] = React.useState<string>();
    const [settingValues, setSettingValues] = React.useState<any>();

    const exporterNames = React.useMemo(
        () => Object.keys(exporterDataByName || {}),
        [exporterDataByName]
    );

    const exporterMeta = React.useMemo(
        () => exporterDataByName[selectedExporter]?.meta,
        [exporterDataByName, selectedExporter]
    );
    const exportType = React.useMemo(
        () => exporterDataByName[selectedExporter]?.type,
        [exporterDataByName, selectedExporter]
    );
    const smartFormFields = React.useMemo(() => {
        if (!exporterMeta) {
            return {};
        }
        const fields = {};
        Object.entries(exporterMeta).forEach(([key, value]) => {
            const field = {
                field_type: value.type,
            };
            if (value.options) {
                field['options'] = value.options;
            }
            fields[key] = field;
        });
        return fields;
    }, [exporterMeta]);

    const handleSettingValuesChange = React.useCallback((key, value) => {
        setSettingValues((currVals) => {
            const vals = { ...currVals };
            vals[key] = value;
            return vals;
        });
    }, []);

    React.useEffect(() => {
        if (exporterNames.length === 0) {
            dispatch(fetchDAGExporters());
        }
    }, [dispatch, exporterNames]);

    React.useEffect(() => {
        if (exporterNames.length && !selectedExporter) {
            setSelectedExporter(exporterNames[0]);
        }
    }, [exporterNames, selectedExporter]);

    React.useEffect(() => {
        if (savedMeta[selectedExporter]) {
            setSettingValues(savedMeta[selectedExporter]);
        }
    }, [savedMeta, selectedExporter]);

    React.useEffect(() => {
        if (exporterMeta && !settingValues) {
            const initialValues = {};
            Object.keys(exporterMeta).map((key) => {
                initialValues[key] = undefined;
            });
            setSettingValues(initialValues);
        }
    }, [exporterMeta, settingValues]);

    return {
        exporterNames,
        selectedExporter,
        setSelectedExporter,
        settingValues,
        smartFormFields,
        handleSettingValuesChange,
        exportType,
    };
}
