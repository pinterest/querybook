import { Form, Formik } from 'formik';
import React, { useCallback, useState } from 'react';

import { GitHubResource } from 'resource/github';
import { Button } from 'ui/Button/Button';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { Icon } from 'ui/Icon/Icon';
import { Message } from 'ui/Message/Message';

import './GitHub.scss';

interface IProps {
    docId: number;
    linkedDirectory: string | null;
}

export const GitHubPush: React.FunctionComponent<IProps> = ({
    docId,
    linkedDirectory,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const handlePush = useCallback(
        async (values: { commitMessage: string }) => {
            setIsSubmitting(true);
            setErrorMessage(null);
            try {
                await GitHubResource.commitDataDoc(docId, values.commitMessage);
                alert('Commit pushed successfully!');
            } catch (error) {
                console.error('Failed to push commit:', error);
                setErrorMessage(
                    'Failed to push commit. Please ensure the file path exists.'
                );
                alert('Failed to push commit');
            } finally {
                setIsSubmitting(false);
            }
        },
        [docId, setErrorMessage]
    );

    if (!linkedDirectory) {
        return (
            <div className="feature-disabled">
                <Icon
                    name="AlertCircle"
                    size={128}
                    color="light"
                    className="feature-disabled-icon"
                />
                <Message
                    message="This feature is currently disabled. Please link your DataDoc in Settings to enable."
                    type="info"
                />
            </div>
        );
    }

    return (
        <Formik
            initialValues={{
                commitMessage: '',
            }}
            onSubmit={handlePush}
        >
            {({ handleSubmit, isValid }) => (
                <FormWrapper className="GitHubPush" minLabelWidth="150px">
                    <Form>
                        <SimpleField
                            stacked
                            name="commitMessage"
                            label="Commit Message"
                            placeholder={`Update DataDoc ${docId}`}
                            type="textarea"
                            rows={6}
                        />
                        <div className="center-align">
                            <Button
                                onClick={() => handleSubmit()}
                                title="Push"
                                disabled={isSubmitting || !isValid}
                            />
                        </div>
                    </Form>
                    {errorMessage && (
                        <div className="error-message">
                            <Message message={errorMessage} type="error" />
                        </div>
                    )}
                </FormWrapper>
            )}
        </Formik>
    );
};
