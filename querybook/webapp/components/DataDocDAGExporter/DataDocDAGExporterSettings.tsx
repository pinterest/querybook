import * as React from 'react';

import { titleize } from 'lib/utils';
import { useExporterSettings } from 'hooks/dag/useExporterSettings';

import { SmartForm } from 'ui/SmartForm/SmartForm';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';
import { FormSectionHeader } from 'ui/Form/FormField';
import { Button } from 'ui/Button/Button';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';

interface IProps {
    onExport: (name: string, settings: any) => void;
    savedMeta: Record<string, any>;
    onSave: (meta: any) => Promise<any>;
}

export const DataDocDAGExporterSettings: React.FunctionComponent<IProps> = ({
    onExport,
    savedMeta,
    onSave,
}) => {
    const {
        exporterNames,
        selectedExporter,
        setSelectedExporter,
        settingValues,
        exporterMeta,
        handleSettingValuesChange,
    } = useExporterSettings({ savedMeta });

    const handleExport = React.useCallback(async () => {
        await onExport(selectedExporter, settingValues);
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
                {exporterMeta && settingValues && (
                    <SmartForm
                        formField={exporterMeta}
                        value={settingValues}
                        onChange={handleSettingValuesChange}
                    />
                )}
            </div>
            <div className="DataDocDAGExporter-bottom flex-row right-align">
                {selectedExporter && (
                    <>
                        <Button
                            icon="Save"
                            title="Save Progress"
                            onClick={() => onSave(settingValues)}
                        />
                        <AsyncButton
                            icon="FileOutput"
                            title={`Export to ${titleize(
                                selectedExporter,
                                '_',
                                ' '
                            )}`}
                            onClick={handleExport}
                        />
                    </>
                )}
            </div>
        </div>
    );
};
