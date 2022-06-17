import { useFormikContext } from 'formik';
import React, { useCallback, useMemo, useState } from 'react';

import { IQueryExecutionImporterConfig } from 'const/tableUpload';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button } from 'ui/Button/Button';
import { StepsBar } from 'ui/StepsBar/StepsBar';

import { ITableUploadFormikForm, TableUploaderStepValue } from './types';

const TableUploaderStepsDOM: React.ReactChild[] = [
    'Select Source',
    'Table Spec',
    'Upload',
];

function useMaxUploaderStep(config: ITableUploadFormikForm): number {
    return useMemo(() => {
        switch (config.import_config.source_type) {
            case 'file': {
                if (!config.file) {
                    return TableUploaderStepValue.SourceConfig;
                }
                break;
            }
            case 'query_execution': {
                if (
                    (config.import_config as IQueryExecutionImporterConfig)
                        .query_execution_id == null
                ) {
                    return TableUploaderStepValue.SourceConfig;
                }
                break;
            }
        }

        if (
            !config.table_config.table_name ||
            !config.table_config.schema_name ||
            config.engine_id == null
        ) {
            return TableUploaderStepValue.TableConfig;
        }

        return TableUploaderStepValue.UploadConfirm;
    }, [config]);
}

export function useTableUploaderStep() {
    const { values: config, setFieldValue } =
        useFormikContext<ITableUploadFormikForm>();

    const maxStep = useMaxUploaderStep(config);
    const [step, setStep] = useState(maxStep);

    const handleSetStep = useCallback(
        (delta: number) => {
            setStep((step) => {
                if (step === 0 && delta > 0) {
                    setFieldValue('auto_generated_column_types', false);
                }
                return step + delta;
            });
        },
        [setFieldValue]
    );

    return [step, maxStep, handleSetStep] as const;
}

export const TableUploaderStepHeader: React.FC<{
    step: number;
}> = ({ step }) => (
    <div className="TableUploaderStep flex1">
        <StepsBar steps={TableUploaderStepsDOM} activeStep={step} />
    </div>
);

export const TableUploaderStepFooter: React.FC<{
    step: number;
    maxStep: number;
    setStep: (step: number) => void;
}> = ({ step, maxStep, setStep }) => {
    const { submitForm } = useFormikContext<ITableUploadFormikForm>();

    return (
        <div className="TableUploaderStep-footer horizontal-space-between pb12 ph8">
            <div>
                {step >= 1 && (
                    <Button title="Previous" onClick={() => setStep(-1)} />
                )}
            </div>
            <div>
                {step < TableUploaderStepsDOM.length - 1 ? (
                    <Button
                        title="Next"
                        onClick={() => setStep(1)}
                        disabled={step >= maxStep}
                    />
                ) : (
                    <AsyncButton
                        color="confirm"
                        icon="Upload"
                        title="Create Table"
                        onClick={submitForm}
                    />
                )}
            </div>
        </div>
    );
};
