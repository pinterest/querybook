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

interface IProps {
    onExport: (name: string, settings: any) => Promise<string>;
    savedMeta: Record<string, any>;
}

export const DataDocDAGExporterSettings: React.FunctionComponent<IProps> = ({
    onExport,
    savedMeta,
}) => {
    const dispatch = useDispatch();

    const exporterMetaByName = useSelector(
        (state: IStoreState) => state.dataDoc.dagExporterMetaByName
    );

    const [selectedExporter, setSelectedExporter] = React.useState<string>();
    const [settingValues, setSettingValues] = React.useState<any>();
    const [isWaitingForLink, setIsWaitingForLink] = React.useState<boolean>(
        false
    );
    const [exportLink, setExportLink] = React.useState<string>();

    const exporterNames = React.useMemo(
        () => Object.keys(exporterMetaByName || {}),
        [exporterMetaByName]
    );

    const exporterMeta = React.useMemo(
        () => exporterMetaByName[selectedExporter],
        [exporterMetaByName, selectedExporter]
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
        setExportLink(undefined);
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
        setExportLink(exportData);
        setIsWaitingForLink(false);
    }, [onExport, selectedExporter, settingValues]);

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
                {exportLink && (
                    <Button
                        color="accent"
                        onClick={() => window.open(exportLink)}
                        title="Open Export Link"
                        icon="ExternalLink"
                    />
                )}
            </div>
        </div>
    );
};
