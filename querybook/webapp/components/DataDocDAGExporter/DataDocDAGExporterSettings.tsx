import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchDAGExporters } from 'redux/dataDoc/action';
import { IStoreState } from 'redux/store/types';
import { titleize } from 'lib/utils';

import { SmartForm } from 'ui/SmartForm/SmartForm';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';
import { FormSectionHeader } from 'ui/Form/FormField';
import { Button } from 'ui/Button/Button';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { CopyPasteModal } from 'ui/CopyPasteModal/CopyPasteModal';

interface IProps {
    onExport: (name: string, settings: any) => Promise<string>;
    savedMeta: Record<string, any>;
}

export const DataDocDAGExporterSettings: React.FunctionComponent<IProps> = ({
    onExport,
    savedMeta,
}) => {
    const dispatch = useDispatch();

    const exporterDataByName = useSelector(
        (state: IStoreState) => state.dataDoc.dagExporterDataByName
    );

    const [selectedExporter, setSelectedExporter] = React.useState<string>();
    const [settingValues, setSettingValues] = React.useState<any>();
    const [isWaitingForLink, setIsWaitingForLink] = React.useState<boolean>(
        false
    );
    const [exportData, setExportData] = React.useState<string>();
    const [showExportModal, setShowExportModal] = React.useState<boolean>(
        false
    );

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
        setExportData(undefined);
    }, [selectedExporter]);

    React.useEffect(() => {
        if (exporterMeta && !settingValues) {
            const initialValues = {};
            Object.keys(exporterMeta).map((key) => {
                initialValues[key] = undefined;
            });
            setSettingValues(initialValues);
        }
    }, [exporterMeta, settingValues]);

    const handleExport = React.useCallback(async () => {
        setIsWaitingForLink(true);
        const exportData: string = await onExport(
            selectedExporter,
            settingValues
        );
        setExportData(exportData);
        setIsWaitingForLink(false);
    }, [onExport, selectedExporter, settingValues]);

    const handleViewExport = React.useCallback(() => {
        if (exportType === 'url') {
            window.open(exportData);
        } else {
            setShowExportModal(true);
        }
    }, [exportData, exportType]);

    return (
        <div className="DataDocDAGExporterSettings">
            <div className="DataDocDAGExporterSettings-form">
                <FormSectionHeader>Exporter</FormSectionHeader>
                <SimpleReactSelect
                    options={exporterNames}
                    value={selectedExporter}
                    onChange={setSelectedExporter}
                />
                <FormSectionHeader>Settings</FormSectionHeader>
                {settingValues && (
                    <SmartForm
                        formField={{
                            field_type: 'struct',
                            fields: smartFormFields,
                        }}
                        value={settingValues}
                        onChange={handleSettingValuesChange}
                    />
                )}
            </div>
            <div className="DataDocDAGExporter-bottom flex-row right-align">
                {selectedExporter && (
                    <AsyncButton
                        icon="FileOutput"
                        title={`Save Settings & Export to ${titleize(
                            selectedExporter,
                            '_',
                            ' '
                        )}`}
                        onClick={handleExport}
                        isLoading={isWaitingForLink}
                    />
                )}
                {exportData && (
                    <Button
                        color="accent"
                        onClick={handleViewExport}
                        title="View Export"
                        icon="BookOpen"
                    />
                )}
            </div>
            {showExportModal && (
                <CopyPasteModal
                    text={exportData}
                    title={`Export to ${titleize(selectedExporter, '_', ' ')}`}
                    onHide={() => setShowExportModal(false)}
                />
            )}
        </div>
    );
};
