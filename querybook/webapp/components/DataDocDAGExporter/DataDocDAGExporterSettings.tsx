import * as React from 'react';

import { titleize } from 'lib/utils';
import { useExporterSettings } from 'hooks/dag/useExporterSettings';

import { SmartForm } from 'ui/SmartForm/SmartForm';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';
import { FormSectionHeader } from 'ui/Form/FormField';
import { Button } from 'ui/Button/Button';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { CopyPasteModal } from 'ui/CopyPasteModal/CopyPasteModal';
import { Modal } from 'ui/Modal/Modal';

interface IProps {
    onExport: (name: string, settings: any) => Promise<string>;
    savedMeta: Record<string, any>;
    onSave: (meta: any) => Promise<any>;
    clearExportData: () => void;
    exportData?: string;
}

export const DataDocDAGExporterSettings: React.FunctionComponent<IProps> = ({
    onExport,
    savedMeta,
    onSave,
    clearExportData,
    exportData,
}) => {
    const {
        exporterNames,
        selectedExporter,
        setSelectedExporter,
        settingValues,
        exporterMeta,
        handleSettingValuesChange,
        exportType,
    } = useExporterSettings({ savedMeta });

    const exportModalTitle = React.useMemo(
        () => `Export to ${titleize(selectedExporter, '_', ' ')}`,
        [selectedExporter]
    );

    React.useEffect(() => {
        clearExportData();
    }, [selectedExporter, settingValues]);

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
            {exportData &&
                (exportType === 'url' ? (
                    <Modal onHide={clearExportData} title={exportModalTitle}>
                        <div className="flex-center mv24">
                            <Button
                                icon="ChevronRight"
                                title="Go To Export"
                                onClick={() => window.open(exportData)}
                            />
                        </div>
                    </Modal>
                ) : (
                    <CopyPasteModal
                        text={exportData}
                        title={exportModalTitle}
                        onHide={clearExportData}
                    />
                ))}
        </div>
    );
};
