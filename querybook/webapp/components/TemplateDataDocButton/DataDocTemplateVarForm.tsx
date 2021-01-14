import React from 'react';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';

import { FormField, FormFieldInputSection } from 'ui/Form/FormField';
import { Title } from 'ui/Title/Title';
import { Button } from 'ui/Button/Button';
import { InfoButton } from 'ui/Button/InfoButton';
import { IconButton } from 'ui/Button/IconButton';
import './DataDocTemplateVarForm.scss';
import { Link } from 'ui/Link/Link';

export interface IDataDocTemplateVarFormProps {
    onSave: (vars: Record<string, string>) => any;
    templatedVariables: Record<string, string>;
    isEditable: boolean;
}

const templatedVarSchema = Yup.object().shape({
    variables: Yup.array().of(Yup.string().min(1)),
});

export const DataDocTemplateVarForm: React.FunctionComponent<IDataDocTemplateVarFormProps> = ({
    onSave,
    templatedVariables,
    isEditable,
}) => (
    <Formik
        validationSchema={templatedVarSchema}
        initialValues={{
            variables: Object.entries(templatedVariables),
        }}
        onSubmit={({ variables }) =>
            onSave(
                variables.reduce((hash, [name, value]) => {
                    hash[name] = value;
                    return hash;
                }, {})
            )
        }
        render={({ handleSubmit, isSubmitting, isValid, values }) => {
            const variablesField = (
                <FieldArray
                    name="variables"
                    render={(arrayHelpers) => {
                        const fields = values.variables.length
                            ? values.variables.map((ignore, index) => (
                                  <div
                                      key={index}
                                      className="horizontal-space-between template-key-value-row"
                                  >
                                      <FormField>
                                          <FormFieldInputSection>
                                              <Field
                                                  name={`variables.${index}[0]`}
                                                  placeholder="Insert name"
                                              />
                                          </FormFieldInputSection>
                                          <FormFieldInputSection>
                                              <Field
                                                  name={`variables.${index}[1]`}
                                                  placeholder="Insert value"
                                              />
                                          </FormFieldInputSection>
                                      </FormField>
                                      <div>
                                          <IconButton
                                              disabled={!isEditable}
                                              icon="x"
                                              onClick={() =>
                                                  arrayHelpers.remove(index)
                                              }
                                          />
                                      </div>
                                  </div>
                              ))
                            : null;
                        const controlDOM = isEditable && (
                            <div className="flex-right">
                                <Button
                                    title="Add New Variable"
                                    onClick={() => arrayHelpers.push(['', ''])}
                                />
                                <Button
                                    onClick={() => handleSubmit()}
                                    title="Save"
                                    disabled={isSubmitting || !isValid}
                                />
                            </div>
                        );

                        return (
                            <div className="DataDocTemplateVarForm-content">
                                <fieldset
                                    disabled={!isEditable}
                                    className="mb8"
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
                    <Form>
                        <div className="horizontal-space-between">
                            <div>
                                <Title>Templated Variables</Title>
                            </div>
                            <div>
                                <InfoButton layout={['bottom', 'right']}>
                                    <div>
                                        <p>
                                            {'Put {{variable_name}} in your query and it will get substituted with ' +
                                                'variable_value. Some variables are provided automatically. Such as:'}
                                            <ul>
                                                <li>
                                                    {
                                                        '{{today}} which maps to todays date in yyyy-mm-dd'
                                                    }
                                                </li>
                                                <li>
                                                    {
                                                        "{{yesterday}} which maps to yesterday's date"
                                                    }
                                                </li>
                                            </ul>
                                        </p>
                                        <p>
                                            {
                                                'You can also put variable definitions in variables for recursive rendering.'
                                            }
                                        </p>
                                        <p>
                                            <Link
                                                to={
                                                    'https://jinja.palletsprojects.com/en/2.11.x/templates/'
                                                }
                                            >
                                                See complete guide here.
                                            </Link>
                                        </p>
                                    </div>
                                </InfoButton>
                            </div>
                        </div>
                        {variablesField}
                    </Form>
                </div>
            );
        }}
    />
);
