import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

import ds from 'lib/datasource';
import { FormField } from 'ui/Form/FormField';
import { Message } from 'ui/Message/Message';
import { Button } from 'ui/Button/Button';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';

export interface ISignupFormProps {
    onSuccessLogin: () => any;
}

const signupSchema = Yup.object().shape({
    username: Yup.string()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Username required'),
    password: Yup.string()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Password required'),
    email: Yup.string().email('Invalid email').required('Email required'),
});

function validatePassword(values) {
    const errors = {};

    if (values.password !== values.password2) {
        errors['password2'] = 'Password must match';
    }

    return errors;
}

export const SignupForm: React.FunctionComponent<ISignupFormProps> = ({
    onSuccessLogin,
}) => {
    const [errorMessage, setErrorMessage] = React.useState<string>(null);
    return (
        <Formik
            validate={validatePassword}
            validationSchema={signupSchema}
            initialValues={{
                username: '',
                password: '',
                password2: '',
                email: '',
            }}
            onSubmit={({ username, password, email }) =>
                ds
                    .save('/signup/', {
                        username,
                        password,
                        email,
                    })
                    .then(onSuccessLogin, (error) =>
                        setErrorMessage(String(error))
                    )
            }
        >
            {({ handleSubmit, isSubmitting, isValid }) => {
                const usernameField = (
                    <SimpleField type="input" name="username" />
                );

                const emailField = (
                    <FormField
                        label="Email"
                        error={() => <ErrorMessage name="email" />}
                    >
                        <Field type="email" name="email" />
                    </FormField>
                );

                const passwordField = (
                    <SimpleField
                        type="input"
                        name="password"
                        inputType="password"
                    />
                );

                const password2Field = (
                    <SimpleField
                        type="input"
                        name="password2"
                        inputType="password"
                    />
                );

                const errorMessageDOM = errorMessage && (
                    <Message message={errorMessage} type="error" />
                );
                const signupButton = (
                    <Button
                        onClick={() => handleSubmit()}
                        title="Signup"
                        disabled={isSubmitting || !isValid}
                    />
                );

                return (
                    <FormWrapper className="SignupForm" minLabelWidth="150px">
                        <Form>
                            {usernameField}
                            {emailField}
                            {passwordField}
                            {password2Field}
                            {errorMessageDOM}
                            <br />
                            <div className="center-align">{signupButton}</div>
                        </Form>
                    </FormWrapper>
                );
            }}
        </Formik>
    );
};
