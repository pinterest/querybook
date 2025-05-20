import { Form, Formik } from 'formik';
import React, { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import * as Yup from 'yup';

import { MultiCreatableUserSelect } from 'components/UserSelect/MultiCreatableUserSelect';
import { IPeerReviewParams } from 'const/datadoc';
import { usePeerReview } from 'lib/peer-review/config';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { FormField } from 'ui/Form/FormField';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { Icon } from 'ui/Icon/Icon';
import { Link } from 'ui/Link/Link';
import { Markdown } from 'ui/Markdown/Markdown';
import { Message } from 'ui/Message/Message';
import { Modal } from 'ui/Modal/Modal';
import { IStandardModalProps } from 'ui/Modal/types';

import './QueryPeerReviewModal.scss';

interface IQueryPeerReviewFormProps {
    onSubmit: (peerReviewParams: IPeerReviewParams) => Promise<number>;
    onHide: () => void;
}

interface IDescriptionSectionProps {
    description: string;
    tip: string;
    guideLink: string;
}

const DescriptionSection: React.FC<IDescriptionSectionProps> = ({
    description,
    tip,
    guideLink,
}) => (
    <div className="description-section">
        <Message type="info" size="large">
            <div className="description-content">
                <div className="main-description">
                    <h4>About Peer Review</h4>
                    <Markdown>{description}</Markdown>
                </div>

                <div className="checklist-box">
                    <h4>Review Checklist</h4>
                    <Markdown>{tip}</Markdown>
                    <div className="guide-link">
                        <Link to={guideLink} newTab>
                            <Icon name="Book" size={12} />
                            <span>View Complete Guidelines</span>
                        </Link>
                    </div>
                </div>
            </div>
        </Message>
    </div>
);

export const QueryPeerReviewForm: React.FC<IQueryPeerReviewFormProps> = ({
    onSubmit,
    onHide,
}) => {
    const initialValues = {
        reviewers: [],
        requestReason: '',
    };

    const peerReviewFormSchema = Yup.object().shape({
        reviewers: Yup.array()
            .min(1, 'Please select at least one reviewer')
            .required('Please select at least one reviewer'),
        requestReason: Yup.string()
            .trim()
            .required('Justification is required')
            .min(
                10,
                'Please provide a detailed justification (minimum 10 characters)'
            ),
    });

    const {
        requestTexts: { description, guideLink, reviewTip },
    } = usePeerReview();

    const handleSubmit = useCallback(
        async (values) => {
            try {
                const reviewerIds = values.reviewers
                    .filter((v) => 'isUser' in v && v.isUser)
                    .map((v) => v.value);

                const peerReviewParams = {
                    reviewer_ids: reviewerIds,
                    request_reason: values.requestReason,
                };
                const queryId = await onSubmit(peerReviewParams);
                onHide();

                if (queryId) {
                    toast.success(
                        'Peer review request submitted successfully. You may also check the Reviews panel on the left to track all review statuses.',
                        { duration: 5000 }
                    );
                    navigateWithinEnv(`/query_execution/${queryId}/`);
                }

                return queryId;
            } catch (error) {
                toast.error('Failed to request review.');
                throw error;
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
                        <DescriptionSection
                            description={description}
                            tip={reviewTip}
                            guideLink={guideLink}
                        />

                        <FormField
                            label="Reviewers"
                            stacked
                            help="Ensure selected reviewers have sufficient context to review the query"
                            required
                        >
                            <MultiCreatableUserSelect
                                value={values.reviewers}
                                onChange={(selected) => {
                                    setFieldValue('reviewers', selected);
                                }}
                                selectProps={{
                                    isClearable: true,
                                    placeholder:
                                        'Select reviewers for the query',
                                    isValidNewOption: () => false,
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
                            help="Why do you need to run this sensitive query?"
                            required
                        />

                        <div className="modal-footer-buttons">
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
        title="Request a Peer Review for Your Query"
        className="QueryPeerReviewModal"
    >
        <QueryPeerReviewForm onSubmit={onSubmit} onHide={onHide} />
    </Modal>
);
