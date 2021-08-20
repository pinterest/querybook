import React from 'react';
import { Formik, Form } from 'formik';

import { Button } from 'ui/Button/Button';
import { Message } from 'ui/Message/Message';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { UserResource } from 'resource/user';

export interface ILoginFormProps {
    onSuccessLogin: () => any;
}

export const LoginForm: React.FunctionComponent<ILoginFormProps> = ({
    onSuccessLogin,
}) => {
    const [errorMessage, setErrorMessage] = React.useState<string>(null);
    return (
        <Formik
            initialValues={{
                username: '',
                password: '',
            }}
            onSubmit={({ username, password }) =>
                UserResource.login(username, password).then(
                    onSuccessLogin,
                    (error) => setErrorMessage(String(error))
                )
            }
        >
            {({ handleSubmit, isSubmitting, isValid }) => {
                const usernameField = (
                    <SimpleField type="input" name="username" />
                );

                const passwordField = (
                    <SimpleField
                        type="input"
                        name="password"
                        inputType="password"
                    />
                );

                const errorMessageDOM = errorMessage && (
                    <Message message={errorMessage} type="error" />
                );
                const loginButton = (
                    <Button
                        onClick={() => handleSubmit()}
                        title="Login"
                        disabled={isSubmitting || !isValid}
                    />
                );

                return (
                    <FormWrapper className="LoginForm" minLabelWidth="150px">
                        <Form>
                            {usernameField}
                            {passwordField}
                            {errorMessageDOM}
                            <br />
                            <div className="center-align">{loginButton}</div>
                        </Form>
                    </FormWrapper>
                );
            }}
        </Formik>
    );
};
