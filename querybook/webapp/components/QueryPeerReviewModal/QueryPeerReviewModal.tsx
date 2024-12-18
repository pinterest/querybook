import { Form, Formik } from 'formik';
import React, { useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';

import { MultiCreatableUserSelect } from 'components/UserSelect/MultiCreatableUserSelect';
import { IPeerReviewParams } from 'const/datadoc';
import { PEER_REVIEW_CONFIG } from 'lib/public-config';
import { notificationServiceSelector } from 'redux/notificationService/selector';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { FormField } from 'ui/Form/FormField';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { Link } from 'ui/Link/Link';
import { Message } from 'ui/Message/Message';
import { Modal } from 'ui/Modal/Modal';
import { IStandardModalProps } from 'ui/Modal/types';

import './QueryPeerReviewModal.scss';

interface IQueryPeerReviewFormProps {
    onSubmit: (peerReviewParams: IPeerReviewParams) => Promise<void>;
    onHide: () => void;
}

const QueryPeerReviewForm: React.FC<IQueryPeerReviewFormProps> = ({
    onSubmit,
    onHide,
}) => {
    const notifiers = useSelector(notificationServiceSelector);
    const notifierOptions = useMemo(
        () =>
            notifiers.map((notifier) => ({
                value: notifier.name,
                label: notifier.name,
            })),
        [notifiers]
    );
    const getNotifierHelp = useCallback(
        (notifierName: string) =>
            notifiers.find((n) => n.name === notifierName)?.help ||
            'Add comma(,) separated recipients here',
        [notifiers]
    );

    const initialValues = {
        notifyWith: '',
        reviewers: [],
        requestReason: '',
    };

    const peerReviewFormSchema = Yup.object().shape({
        notifyWith: Yup.string().required(
            'Please select a notification method'
        ),
        reviewers: Yup.array()
            .min(1, 'Please select at least one reviewer')
            .required('Please select at least one reviewer'),
        requestReason: Yup.string()
            .trim()
            .required('Justification is required'),
    });

    const {
        description: featureDescription,
        user_guide_link: helpLink,
        review_tip: reviewTip,
    } = PEER_REVIEW_CONFIG;

    const handleSubmit = useCallback(
        async (values) => {
            try {
                const notifierName = values.notifyWith;
                const reviewerIds = values.reviewers
                    .filter((v) => 'isUser' in v && v.isUser)
                    .map((v) => v.value);

                const externalRecipients = values.reviewers
                    .filter((v) => !('isUser' in v) || !v.isUser)
                    .map((v) => v.value);

                const peerReviewParams = {
                    reviewer_ids: reviewerIds,
                    external_recipients: externalRecipients,
                    notifier_name: notifierName,
                    request_reason: values.requestReason,
                };
                await onSubmit(peerReviewParams);

                onHide();
                toast.success(
                    'Review request sent! Reviewers were notified and your query will run upon approval.',
                    { duration: 3000 }
                );
            } catch (error) {
                toast.error('Failed to request review.');
            }
        },
        [onHide, onSubmit]
    );

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={peerReviewFormSchema}
            onSubmit={handleSubmit}
        >
            {({ submitForm, isSubmitting, isValid, setFieldValue, values }) => (
                <FormWrapper minLabelWidth="150px">
                    <Form>
                        <div className="mb4 flex-row">
                            <Message type="info" size="large">
                                {featureDescription} Learn more{' '}
                                <Link to={helpLink} newTab>
                                    <strong>here</strong>.
                                </Link>
                            </Message>
                        </div>
                        {reviewTip && (
                            <Message
                                className="mb12"
                                type="warning"
                                size="small"
                                message={reviewTip}
                            />
                        )}

                        <SimpleField
                            label="Notify With"
                            name="notifyWith"
                            type="react-select"
                            options={notifierOptions}
                            withDeselect={false}
                            stacked
                        />

                        <FormField
                            label="Reviewers"
                            stacked
                            help={
                                'Ensure selected reviewers have sufficient context to review the query'
                            }
                            required
                        >
                            <MultiCreatableUserSelect
                                value={values.reviewers}
                                onChange={(selected) => {
                                    setFieldValue('reviewers', selected);
                                }}
                                selectProps={{
                                    isClearable: true,
                                    placeholder: getNotifierHelp(
                                        values.notifyWith
                                    ),
                                }}
                            />
                        </FormField>

                        <SimpleField
                            name="requestReason"
                            label="Justification"
                            type="textarea"
                            placeholder="Provide a justification."
                            rows={4}
                            stacked
                            help={
                                'Why do you need to run this sensitive query?'
                            }
                            required
                        />

                        <div className="center-align mt16">
                            <AsyncButton
                                onClick={submitForm}
                                disabled={!isValid || isSubmitting}
                                title="Submit"
                                color="accent"
                                pushable
                            />
                        </div>
                    </Form>
                </FormWrapper>
            )}
        </Formik>
    );
};

export const QueryPeerReviewModal: React.FC<
    IQueryPeerReviewFormProps & IStandardModalProps
> = ({ onSubmit, onHide, ...modalProps }) => (
    <Modal
        {...modalProps}
        onHide={onHide}
        title="Request a peer review for your query"
        className="QueryPeerReviewModal"
    >
        <QueryPeerReviewForm onSubmit={onSubmit} onHide={onHide} />
    </Modal>
);
