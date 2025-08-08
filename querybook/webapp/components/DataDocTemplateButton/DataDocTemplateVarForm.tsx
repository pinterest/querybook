import { FieldArray, Form, Formik } from 'formik';
import { uniqueId } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import * as Yup from 'yup';

import {
    IDataDocMeta,
    IDataDocMetaVariable,
    TEMPLATED_VAR_SUPPORTED_TYPES,
} from 'const/datadoc';
import { stopPropagationAndDefault } from 'lib/utils/noop';
import { Button, TextButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { DraggableIcon } from 'ui/DraggableList/DraggableIcon';
import { DraggableList } from 'ui/DraggableList/DraggableList';
import { SimpleField } from 'ui/FormikField/SimpleField';

import { typeCastVariables } from './helpers';

import './DataDocTemplateVarForm.scss';

export interface IDataDocTemplateVarFormProps {
    onSave: (variables: IDataDocMeta['variables']) => Promise<void>;
    variables: IDataDocMeta['variables'];
    isEditable: boolean;
    isExecutable?: boolean; // If false, user can only edit values, not structure
}

const templatedVarSchema = Yup.object().shape({
    variables: Yup.array().of(
        Yup.object({
            name: Yup.string().required('Variable name must not be empty'),
            type: Yup.string(),
            value: Yup.mixed()
                .required('Must not be empty')
                .when('type', {
                    is: 'number',
                    then: Yup.number()
                        .typeError('Must be a number')
                        .required('Must not be empty')
                        .max(
                            Number.MAX_SAFE_INTEGER,
                            'The number exceeds limit(2^53 - 1), please use string type instead'
                        ),
                }),
        })
    ),
});

/**
 * This interface is used for drag and drop purposes
 */
interface IDataDocMetaVariableWithId extends IDataDocMetaVariable {
    id: string;
}
const templatedVarUniqueIdPrefix = 'tvar_';

const defaultTemplatedVariables: IDataDocMetaVariableWithId[] = [
    {
        name: '',
        value: '',
        type: 'string',
        id: uniqueId(templatedVarUniqueIdPrefix),
    },
];

export const DataDocTemplateVarForm: React.FunctionComponent<
    IDataDocTemplateVarFormProps
> = ({ onSave, variables, isEditable, isExecutable }) => {
    const initialValue = useMemo(
        () => ({
            variables: variables?.length
                ? variables.map((varConfig) => ({
                      ...varConfig,
                      id: uniqueId(templatedVarUniqueIdPrefix),
                  }))
                : defaultTemplatedVariables,
        }),

        [variables]
    );

    const handleSaveMeta = useCallback(
        (values: typeof initialValue) =>
            toast.promise(onSave(typeCastVariables(values.variables)), {
                loading: 'Saving variables',
                success: 'Variables saved!',
                error: 'Failed to save variables',
            }),
        [onSave]
    );

    return (
        <Formik
            enableReinitialize
            validationSchema={templatedVarSchema}
            initialValues={initialValue}
            onSubmit={handleSaveMeta}
        >
            {({ handleSubmit, isSubmitting, isValid, values, dirty }) => {
                const variablesField = (
                    <FieldArray
                        name="variables"
                        render={(arrayHelpers) => {
                            const renderVariableConfigRow = (
                                index: number,
                                { type }: IDataDocMetaVariableWithId
                            ) => (
                                <div
                                    key={index}
                                    className="flex-row template-key-value-row"
                                >
                                    <DraggableIcon className="mh4" />
                                    <div
                                        className="flex-row-top flex1"
                                        draggable={true}
                                        onDragStart={stopPropagationAndDefault}
                                    >
                                        <SimpleField
                                            label={() => null}
                                            type="input"
                                            name={`variables.${index}.name`}
                                            inputProps={{
                                                placeholder: 'variable name',
                                                disabled:
                                                    !isEditable && isExecutable,
                                            }}
                                        />
                                        <SimpleField
                                            label={() => null}
                                            type="react-select"
                                            name={`variables.${index}.type`}
                                            options={
                                                TEMPLATED_VAR_SUPPORTED_TYPES as any as string[]
                                            }
                                            isDisabled={!isEditable}
                                        />
                                        {type === 'boolean' ? (
                                            <SimpleField
                                                label={() => null}
                                                type="react-select"
                                                name={`variables.${index}.value`}
                                                options={[
                                                    {
                                                        label: 'True',
                                                        value: true,
                                                    },
                                                    {
                                                        label: 'False',
                                                        value: false,
                                                    },
                                                ]}
                                                isDisabled={
                                                    !isEditable && !isExecutable
                                                }
                                            />
                                        ) : (
                                            <SimpleField
                                                label={() => null}
                                                type={'input'}
                                                name={`variables.${index}.value`}
                                                inputProps={{
                                                    placeholder:
                                                        'variable value',
                                                }}
                                            />
                                        )}
                                    </div>
                                    {isEditable && (
                                        <IconButton
                                            icon="X"
                                            onClick={() =>
                                                arrayHelpers.remove(index)
                                            }
                                        />
                                    )}
                                </div>
                            );

                            const fields = values.variables.length ? (
                                <DraggableList
                                    items={values.variables}
                                    renderItem={(index, varConfig) =>
                                        renderVariableConfigRow(
                                            index,
                                            varConfig as IDataDocMetaVariableWithId
                                        )
                                    }
                                    onMove={arrayHelpers.move}
                                />
                            ) : null;
                            const controlDOM = isExecutable && (
                                <div className="horizontal-space-between mt4">
                                    {isEditable && (
                                        <TextButton
                                            icon="Plus"
                                            title="New Variable"
                                            onClick={() => {
                                                arrayHelpers.push({
                                                    name: '',
                                                    type: 'string',
                                                    value: '',
                                                });
                                            }}
                                        />
                                    )}
                                    {!isEditable && <div />}
                                    {dirty && (
                                        <Button
                                            onClick={() => {
                                                handleSubmit();
                                            }}
                                            title="Save Changes"
                                            disabled={isSubmitting || !isValid}
                                        />
                                    )}
                                </div>
                            );

                            return (
                                <div className="DataDocTemplateVarForm-content mh4">
                                    <fieldset
                                        disabled={!isEditable && !isExecutable}
                                        className="mb4"
                                    >
                                        {fields}
                                    </fieldset>
                                    {controlDOM}
                                </div>
                            );
                        }}
                    />
                );

                return (
                    <div className="DataDocTemplateVarForm">
                        <Form>{variablesField}</Form>
                    </div>
                );
            }}
        </Formik>
    );
};
