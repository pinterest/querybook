import { FieldArray, Form, Formik } from 'formik';
import { isEmpty } from 'lodash';
import React, { useMemo } from 'react';
import * as Yup from 'yup';

import { Button, TextButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { SimpleField } from 'ui/FormikField/SimpleField';

import {
    getVariableValueByType,
    detectVariableType,
    SUPPORTED_TYPES,
    TTemplateVariableDict,
} from './helpers';

import './DataDocTemplateVarForm.scss';

export interface IDataDocTemplateVarFormProps {
    onSave: (vars: TTemplateVariableDict) => any;
    templatedVariables: TTemplateVariableDict;
    defaultTemplatedVariables?: TTemplateVariableDict;
    isEditable: boolean;
}

const templatedVarSchema = Yup.object().shape({
    variables: Yup.array().of(
        Yup.object({
            name: Yup.string().required('Variable name must not be empty'),
            valueType: Yup.string(),
            value: Yup.mixed()
                .required('Must not be empty')
                .when('valueType', {
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

const defaultTemplatedVariablesValue = { '': '' };

export const DataDocTemplateVarForm: React.FunctionComponent<
    IDataDocTemplateVarFormProps
> = ({
    onSave,
    templatedVariables,
    defaultTemplatedVariables = defaultTemplatedVariablesValue,
    isEditable,
}) => {
    const initialValue = useMemo(
        () => ({
            variables: Object.entries(
                isEmpty(templatedVariables)
                    ? defaultTemplatedVariables
                    : templatedVariables
            ).map(
                ([key, value]) =>
                    ({
                        name: key,
                        valueType: detectVariableType(value),
                        value,
                    } as const)
            ),
        }),
        [defaultTemplatedVariables, templatedVariables]
    );

    return (
        <Formik
            enableReinitialize
            validationSchema={templatedVarSchema}
            initialValues={initialValue}
            onSubmit={({ variables }) =>
                onSave(
                    variables.reduce((hash, { name, valueType, value }) => {
                        hash[name] = getVariableValueByType(value, valueType);
                        return hash;
                    }, {})
                )
            }
        >
            {({ handleSubmit, isSubmitting, isValid, values, dirty }) => {
                const variablesField = (
                    <FieldArray
                        name="variables"
                        render={(arrayHelpers) => {
                            const fields = values.variables.length
                                ? values.variables.map(
                                      ({ valueType }, index) => (
                                          <div
                                              key={index}
                                              className="flex-row template-key-value-row"
                                          >
                                              <div className="flex-row-top flex1">
                                                  <SimpleField
                                                      label={() => null}
                                                      type="input"
                                                      name={`variables.${index}.name`}
                                                      inputProps={{
                                                          placeholder:
                                                              'variable name',
                                                      }}
                                                  />
                                                  <SimpleField
                                                      label={() => null}
                                                      type="react-select"
                                                      name={`variables.${index}.valueType`}
                                                      options={
                                                          SUPPORTED_TYPES as any as string[]
                                                      }
                                                      isDisabled={!isEditable}
                                                  />
                                                  {valueType === 'boolean' ? (
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
                                                          arrayHelpers.remove(
                                                              index
                                                          )
                                                      }
                                                  />
                                              )}
                                          </div>
                                      )
                                  )
                                : null;

                            const controlDOM = isEditable && (
                                <div className="horizontal-space-between mt4">
                                    <TextButton
                                        icon="Plus"
                                        title="New Variable"
                                        onClick={() =>
                                            arrayHelpers.push({
                                                name: '',
                                                valueType: 'string',
                                                value: '',
                                            })
                                        }
                                    />
                                    {dirty && (
                                        <Button
                                            onClick={() => handleSubmit()}
                                            title="Save Changes"
                                            disabled={isSubmitting || !isValid}
                                        />
                                    )}
                                </div>
                            );

                            return (
                                <div className="DataDocTemplateVarForm-content mh4">
                                    <fieldset
                                        disabled={!isEditable}
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
