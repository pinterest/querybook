import { Form, Formik } from 'formik';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as Yup from 'yup';

import { GitHubResource } from 'resource/github';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { Icon } from 'ui/Icon/Icon';
import { Loading } from 'ui/Loading/Loading';
import { Message } from 'ui/Message/Message';

interface IProps {
    docId: number;
    linkedDirectory?: string | null;
    onLinkDirectory: (directory: string) => Promise<void>;
}

const validationSchema = Yup.object().shape({
    directory: Yup.string().notRequired(),
});

export const GitHubDirectory: React.FC<IProps> = ({
    docId,
    linkedDirectory,
    onLinkDirectory,
}) => {
    const [directories, setDirectories] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const fetchDirectories = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await GitHubResource.getDirectories(docId);
            setDirectories(data.directories);
        } catch (error) {
            console.error('Failed to fetch directories:', error);
            setErrorMessage('Failed to fetch directories. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [docId]);

    useEffect(() => {
        fetchDirectories();
    }, [fetchDirectories]);

    const directoryOptions = useMemo(
        () =>
            directories.map((dir) => ({
                label: dir,
                value: dir,
            })),
        [directories]
    );

    const handleSubmit = async (values: { directory: string }) => {
        const directory = values.directory || 'datadocs';
        try {
            await onLinkDirectory(directory);
            alert('Directory linked successfully!');
        } catch (error) {
            console.error('Error linking directory:', error);
            setErrorMessage('Failed to link directory. Please try again.');
            throw error;
        }
    };

    const formContent = (
        <Formik
            initialValues={{
                directory: linkedDirectory || 'datadocs',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
        >
            {({ submitForm, isSubmitting, isValid, setFieldValue }) => (
                <FormWrapper minLabelWidth="180px" size={7}>
                    <Form>
                        <SimpleField
                            name="directory"
                            label="Search Directory:"
                            type="react-select"
                            options={directoryOptions}
                            creatable
                            formatCreateLabel={(inputValue) => (
                                <div className="flex-row">
                                    <Icon name="Plus" size={16} />{' '}
                                    <span>Create '{inputValue}' directory</span>
                                </div>
                            )}
                            onCreateOption={(inputValue) =>
                                setFieldValue('directory', inputValue)
                            }
                            onChange={(option) => {
                                setFieldValue('directory', option);
                            }}
                            help="Select or create a directory for DataDoc commits. Defaults to 'datadocs' if left empty."
                        />
                        <div className="mt16">
                            <AsyncButton
                                icon="Save"
                                onClick={submitForm}
                                disabled={!isValid || isSubmitting}
                                title="Link Directory"
                                color="accent"
                                pushable
                            />
                        </div>
                    </Form>
                </FormWrapper>
            )}
        </Formik>
    );

    const linkedDirectoryMessage = (
        <Message
            title="Directory Linking"
            message={`Warning: The current linked directory is ${linkedDirectory}. Changing the linked directory will affect version history and commit pushes.`}
            type="warning"
            icon="AlertTriangle"
            iconSize={20}
            className="mt12"
            size="large"
            center
        />
    );
    const unlinkedDirectoryMessage = (
        <Message
            title="Directory Linking"
            message={
                'Select an existing directory or create a new one. The default directory is datadocs. Directory will be used for DataDoc commits and version history.'
            }
            type="info"
            size="large"
            center
        />
    );

    return (
        <div>
            {linkedDirectory
                ? linkedDirectoryMessage
                : unlinkedDirectoryMessage}
            {isLoading ? (
                <Loading text="Loading GitHub directories..." />
            ) : (
                formContent
            )}
            {errorMessage && (
                <Message
                    title="Error"
                    message={errorMessage}
                    type="error"
                    icon="XCircle"
                    iconSize={20}
                    className="mt12"
                />
            )}
        </div>
    );
};
