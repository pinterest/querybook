import { FieldArray, Formik } from 'formik';
import React, { useMemo } from 'react';
import * as Yup from 'yup';

import { IOptions } from 'lib/utils/react-select';
import { IUDFRendererValues, UDFEngineConfigsByLanguage } from 'lib/utils/udf';

import { Button, SoftButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { FormField } from 'ui/Form/FormField';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { Subtitle, Title } from 'ui/Title/Title';
import { Link } from 'ui/Link/Link';
import { Message } from 'ui/Message/Message';

import { UDFTypeSelect } from './UDFTypeSelect';
import './UDFForm.scss';

interface IUDFFormProps {
    onConfirm: (udfScript: string) => void;
    engineLanguage: string;
}

const UDFFormValuesSchema = Yup.object().shape({
    functionName: Yup.string().min(1).required(),
    udfLanguage: Yup.string().min(1).required(),
    script: Yup.string().min(1).required(),
    // All other fields are optional
});

export const UDFForm: React.FC<IUDFFormProps> = ({
    onConfirm,
    engineLanguage,
}) => {
    const engineUDFConfig = UDFEngineConfigsByLanguage[engineLanguage];
    const languageOptions: IOptions<string> = useMemo(
        () =>
            engineUDFConfig.supportedUDFLanguages.map((languageConfig) => ({
                label: languageConfig.displayName ?? languageConfig.name,
                value: languageConfig.name,
            })),
        [engineUDFConfig]
    );

    const initialValues: IUDFRendererValues = useMemo(
        () => ({
            functionName: '',
            udfLanguage: languageOptions[0].value,
            outputType: '',
            parameters: [],
            script: '',
            ...engineUDFConfig.prefills,
        }),
        [languageOptions, engineUDFConfig]
    );

    return (
        <div className="UDFForm">
            <Formik
                validateOnMount
                initialValues={initialValues}
                onSubmit={(formValues: IUDFRendererValues) => {
                    onConfirm(engineUDFConfig.renderer(formValues));
                }}
                validationSchema={UDFFormValuesSchema}
            >
                {({ values, handleSubmit, isValid }) => {
                    const selectedLanguageConfig = engineUDFConfig.supportedUDFLanguages.find(
                        (l) => l.name === values.udfLanguage
                    );

                    const parametersDOM = selectedLanguageConfig?.noParameters ? null : (
                        <FieldArray
                            name="parameters"
                            render={(arrayHelper) => {
                                const parameterRowsDOM = values.parameters.map(
                                    (_, idx) => (
                                        <div key={idx} className="flex-row">
                                            <div className="flex4">
                                                <SimpleField
                                                    type="input"
                                                    name={`parameters[${idx}].name`}
                                                    label={() => null}
                                                />
                                            </div>
                                            <div className="flex4">
                                                <FormField label={() => null}>
                                                    <UDFTypeSelect
                                                        name={`parameters[${idx}].type`}
                                                        dataTypes={
                                                            engineUDFConfig.dataTypes
                                                        }
                                                    />
                                                </FormField>
                                            </div>

                                            <div className="flex1">
                                                <IconButton
                                                    icon="X"
                                                    onClick={() =>
                                                        arrayHelper.remove(idx)
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )
                                );

                                return (
                                    <div className="UDFForm-parameters">
                                        <Title size="smedium">Parameters</Title>
                                        <div className="flex-row">
                                            <Subtitle className="flex4 ml16">
                                                Name
                                            </Subtitle>
                                            <Subtitle className="flex4 ml16">
                                                Type
                                            </Subtitle>
                                            <div className="flex1" />
                                        </div>

                                        {parameterRowsDOM}
                                        <div className="center-align">
                                            <SoftButton
                                                size="small"
                                                title="Add New Parameter"
                                                icon="Plus"
                                                onClick={() =>
                                                    arrayHelper.push({
                                                        name: '',
                                                        type: '',
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    );

                    return (
                        <>
                            {engineUDFConfig.docs?.length > 0 && (
                                <Message type="tip">
                                    <div>
                                        <b>UDF Docs:</b>
                                    </div>
                                    {engineUDFConfig.docs.map((doc, idx) => (
                                        <Link key={idx} to={doc.url}>
                                            {doc.name ?? doc.url}
                                        </Link>
                                    ))}
                                </Message>
                            )}
                            <SimpleField
                                name="functionName"
                                type="input"
                                label="Function Name *"
                                stacked
                                required
                            />
                            <div className="flex-row">
                                <div className="flex1">
                                    <SimpleField
                                        type="react-select"
                                        name="udfLanguage"
                                        label="Language *"
                                        options={languageOptions}
                                        stacked
                                    />
                                </div>
                                <div className="flex1">
                                    {selectedLanguageConfig?.noOutputType ? null : (
                                        <FormField label="Output Type" stacked>
                                            <UDFTypeSelect
                                                name="outputType"
                                                dataTypes={
                                                    engineUDFConfig.dataTypes
                                                }
                                            />
                                        </FormField>
                                    )}
                                </div>
                            </div>
                            {parametersDOM}
                            <SimpleField
                                type="code-editor"
                                name="script"
                                label="Code *"
                                mode={
                                    selectedLanguageConfig?.codeEditorMode ??
                                    'sql'
                                }
                                stacked
                                required
                            />

                            <div className="right-align">
                                <Button
                                    onClick={() => handleSubmit()}
                                    disabled={!isValid}
                                    title="Submit"
                                />
                            </div>
                        </>
                    );
                }}
            </Formik>
        </div>
    );
};
