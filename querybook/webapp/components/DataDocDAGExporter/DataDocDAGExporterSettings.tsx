import * as React from 'react';

import { titleize } from 'lib/utils';
import { useExporterSettings } from 'hooks/dag/useExporterSettings';

import { SmartForm } from 'ui/SmartForm/SmartForm';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';
import { FormField, FormSectionHeader } from 'ui/Form/FormField';
import { Button } from 'ui/Button/Button';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';
import { IDataDocDAGExportMeta } from 'const/datadoc';

interface IProps {
    onExport: (name: string, settings: any) => Promise<any>;
    savedMeta: IDataDocDAGExportMeta;
    onSave: (meta: any, useTemplatedVariables?: boolean) => Promise<any>;
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
        useTemplatedVariables,
    } = useExporterSettings({ savedMeta });

    const handleExport = React.useCallback(
        () => onExport(selectedExporter, settingValues),
        [onExport, selectedExporter, settingValues]
    );

    return (
        <div className="DataDocDAGExporterSettings">
            <div className="DataDocDAGExporterSettings-form">
                <FormField
                    label="Use Templated Variables"
                    className="horizontal-space-between"
                >
                    <ToggleSwitch
                        checked={useTemplatedVariables}
                        onChange={() => onSave(null, !useTemplatedVariables)}
                    />
                </FormField>
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
                            onClick={() =>
                                onSave(
                                    {
                                        ...savedMeta.exporter_meta,
                                        [selectedExporter]: settingValues,
                                    },
                                    useTemplatedVariables
                                )
                            }
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
