import * as React from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

import { IDataDocDAGExportMeta } from 'const/datadoc';
import { useExporterSettings } from 'hooks/dag/useExporterSettings';
import { titleize } from 'lib/utils';
import { IStoreState } from 'redux/store/types';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button } from 'ui/Button/Button';
import { FormField, FormSectionHeader } from 'ui/Form/FormField';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';
import { SmartForm } from 'ui/SmartForm/SmartForm';
import { Tag } from 'ui/Tag/Tag';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';

interface IProps {
    docId: number;
    onExport: (name: string, settings: any) => Promise<any>;
    savedMeta: IDataDocDAGExportMeta;
    onSave: (meta: any, useTemplatedVariables?: boolean) => Promise<any>;
}

export const DataDocDAGExporterSettings: React.FunctionComponent<IProps> = ({
    docId,
    onExport,
    savedMeta,
    onSave,
}) => {
    const {
        exporterNames,
        selectedExporter,
        setSelectedExporter,
        settingValues,
        exporterEngines,
        exporterMeta,
        handleSettingValuesChange,
        useTemplatedVariables,
    } = useExporterSettings({ docId, savedMeta });

    const queryEngineById = useSelector(
        (state: IStoreState) => state.queryEngine.queryEngineById
    );

    const handleExport = React.useCallback(
        () => onExport(selectedExporter, settingValues),
        [onExport, selectedExporter, settingValues]
    );

    const enginesDOM = exporterEngines && (
        <div>
            {exporterEngines.map((engineId) => (
                <Tag key={engineId} mini>
                    {queryEngineById[engineId].name}
                </Tag>
            ))}
        </div>
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
                <FormSectionHeader>Query Engines Supported</FormSectionHeader>
                {enginesDOM}
                <FormSectionHeader>Settings</FormSectionHeader>
                {exporterMeta && settingValues && (
                    <SmartForm
                        formField={exporterMeta}
                        value={settingValues}
                        onChange={handleSettingValuesChange}
                    />
                )}
            </div>
            <div className="DataDocDAGExporter-bottom">
                {selectedExporter && (
                    <>
                        <Button
                            icon="Save"
                            title="Save"
                            aria-label="Save progress"
                            data-balloon-pos="up"
                            onClick={() => {
                                toast.promise(
                                    onSave(
                                        {
                                            ...savedMeta.exporter_meta,
                                            [selectedExporter]: settingValues,
                                        },
                                        useTemplatedVariables
                                    ),
                                    {
                                        loading: 'Saving progress ...',
                                        success: 'Progress saved successfully',
                                        error: 'Failed to save progress',
                                    },
                                    {
                                        position: 'bottom-center',
                                    }
                                );
                            }}
                        />
                        <AsyncButton
                            icon="FileOutput"
                            title="Export"
                            aria-label={`Export to ${titleize(
                                selectedExporter,
                                '_',
                                ' '
                            )}`}
                            data-balloon-pos="up"
                            color="accent"
                            onClick={handleExport}
                        />
                    </>
                )}
            </div>
        </div>
    );
};
