import * as React from 'react';

import { titleize } from 'lib/utils';

import { Button } from 'ui/Button/Button';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDAGExporters } from 'redux/dataDoc/action';
import { IStoreState } from 'redux/store/types';
import { SmartForm } from 'ui/SmartForm/SmartForm';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';
import { FormSectionHeader } from 'ui/Form/FormField';

interface IProps {
    onCancel: () => void;
    onExport: (name: string, settings: any) => void;
}

export const DataDocDAGExporterSettings: React.FunctionComponent<IProps> = ({
    onCancel,
    onExport,
}) => {
    const dispatch = useDispatch();

    const exporterMetaByName = useSelector(
        (state: IStoreState) => state.dataDoc.dagExporterMetaByName
    );
    const exporterNames = React.useMemo(
        () => Object.keys(exporterMetaByName || {}),
        [exporterMetaByName]
    );

    const [selectedExporter, setSelectedExporter] = React.useState<string>();

    const exporterMeta = React.useMemo(
        () => exporterMetaByName[selectedExporter],
        [exporterMetaByName, selectedExporter]
    );

    const [settingValues, setSettingValues] = React.useState<any>({
        test: 'meww',
    });

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
                <SmartForm
                    formField={{
                        field_type: 'struct',
                        fields: {
                            test: { field_type: 'string' },
                        },
                    }}
                    value={settingValues}
                    onChange={handleSettingValuesChange}
                />
            </div>
            <div className="DataDocDAGExporter-bottom flex-row mr12">
                <Button
                    icon="ChevronLeft"
                    title="Return to Graph"
                    onClick={onCancel}
                />
                {selectedExporter && (
                    <Button
                        icon="FileOutput"
                        title={`Export to ${titleize(
                            selectedExporter,
                            '_',
                            ' '
                        )}`}
                        onClick={() =>
                            onExport(selectedExporter, settingValues)
                        }
                    />
                )}
            </div>
        </div>
    );
};
