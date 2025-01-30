import { Form, Formik } from 'formik';
import React, { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import * as Yup from 'yup';

import { MultiCreatableUserSelect } from 'components/UserSelect/MultiCreatableUserSelect';
import { IPeerReviewParams } from 'const/datadoc';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { FormField } from 'ui/Form/FormField';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { Link } from 'ui/Link/Link';
import { Message } from 'ui/Message/Message';
import { Modal } from 'ui/Modal/Modal';
import { IStandardModalProps } from 'ui/Modal/types';
import { Icon } from 'ui/Icon/Icon';

import './QueryPeerReviewModal.scss';
import { usePeerReview } from 'lib/peer-review/config';

interface IQueryPeerReviewFormProps {
    onSubmit: (peerReviewParams: IPeerReviewParams) => Promise<void>;
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
                    <div className="description-text">{description}</div>
                </div>

                <div className="checklist-box">
                    <h4>Review Checklist</h4>
                    <div className="checklist-content">{tip}</div>
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
            .required('Justification is required'),
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
