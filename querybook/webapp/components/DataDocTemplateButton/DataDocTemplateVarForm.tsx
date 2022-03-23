import React, { useMemo } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';

import { Button, TextButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { SimpleField } from 'ui/FormikField/SimpleField';

import './DataDocTemplateVarForm.scss';
import {
    detectVariableType,
    SUPPORTED_TYPES,
    TTemplateVariableDict,
} from './helpers';
import { isEmpty } from 'lodash';

export interface IDataDocTemplateVarFormProps {
    onSave: (vars: TTemplateVariableDict) => any;
    templatedVariables: TTemplateVariableDict;
    defaultTemplatedVariables?: TTemplateVariableDict;
    isEditable: boolean;
}

const templatedVarSchema = Yup.object().shape({
    variables: Yup.array().of(
        Yup.array().of(Yup.mixed().required('Must not be empty')).length(3)
    ),
});

const defaultTemplatedVariablesValue = { '': '' };

export const DataDocTemplateVarForm: React.FunctionComponent<IDataDocTemplateVarFormProps> = ({
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
                    [key, detectVariableType(value), value] as const
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
                    variables.reduce((hash, [name, _, value]) => {
                        hash[name] = value;
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
                                      ([_, valueType, __], index) => (
                                          <div
                                              key={index}
                                              className="flex-row template-key-value-row"
                                          >
                                              <div className="flex-row-top flex1">
                                                  <SimpleField
                                                      label={() => null}
                                                      type="input"
                                                      name={`variables.${index}[0]`}
                                                      inputProps={{
                                                          placeholder:
                                                              'variable name',
                                                      }}
                                                  />
                                                  <SimpleField
                                                      label={() => null}
                                                      type="react-select"
                                                      name={`variables.${index}[1]`}
                                                      options={
                                                          (SUPPORTED_TYPES as any) as string[]
                                                      }
                                                      isDisabled={!isEditable}
                                                  />
                                                  {valueType === 'boolean' ? (
                                                      <SimpleField
                                                          label={() => null}
                                                          type="react-select"
                                                          name={`variables.${index}[2]`}
                                                          options={[
                                                              {
                                                                  label: 'True',
                                                                  value: true,
                                                              },
                                                              {
                                                                  label:
                                                                      'False',
                                                                  value: false,
                                                              },
                                                          ]}
                                                      />
                                                  ) : valueType === 'number' ? (
                                                      <SimpleField
                                                          label={() => null}
                                                          type={'number'}
                                                          name={`variables.${index}[2]`}
                                                          placeholder="variable value"
                                                      />
                                                  ) : (
                                                      <SimpleField
                                                          label={() => null}
                                                          type={'input'}
                                                          name={`variables.${index}[2]`}
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
                                            arrayHelpers.push([
                                                '',
                                                'string',
                                                '',
                                            ])
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
