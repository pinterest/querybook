import { IQueryExecutionImporterConfig } from 'const/tableUpload';
import { useFormikContext } from 'formik';
import React, { useCallback, useMemo, useState } from 'react';
import { Button } from 'ui/Button/Button';
import { StepsBar } from 'ui/StepsBar/StepsBar';
import { ITableUploadFormikForm, TableUploaderStepValue } from './types';

interface ITableUploaderStepProps {
    children: (step: number) => React.ReactNode;
}

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

        if (!config.table_config.table_name) {
            return TableUploaderStepValue.TableConfig;
        }

        return TableUploaderStepValue.UploadConfirm;
    }, [config]);
}

const TableUploaderStepsDOM: React.ReactChild[] = [
    'Select Source',
    'Table Spec',
    'Upload',
];

export const TableUploaderStep: React.FC<ITableUploaderStepProps> = ({
    children,
}) => {
    const {
        values: config,
        setFieldValue,
    } = useFormikContext<ITableUploadFormikForm>();

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

    const controlFooter = (
        <div className="TableUploaderStep-footer horizontal-space-between">
            <div>
                {step >= 1 && (
                    <Button
                        title="Previous"
                        onClick={() => handleSetStep(-1)}
                    />
                )}
            </div>
            <div>
                {step < TableUploaderStepsDOM.length - 1 && (
                    <Button
                        title="Next"
                        onClick={() => handleSetStep(1)}
                        disabled={step >= maxStep}
                    />
                )}
            </div>
        </div>
    );

    return (
        <div className="TableUploaderStep">
            <div className="TableUploaderStep-header">
                <StepsBar steps={TableUploaderStepsDOM} activeStep={step} />
            </div>
            <div className="TableUploaderStep-content">{children(step)}</div>
            {controlFooter}
        </div>
    );
};
