import clsx from 'clsx';
import React from 'react';
import toast, { Toast } from 'react-hot-toast';

import {
    ISurvey,
    IUpdateSurveyFormData,
    SurveySurfaceType,
    SurveyTypeToQuestion,
} from 'const/survey';
import { saveSurveyRespondRecord } from 'lib/survey/triggerLogic';
import { SurveyResource } from 'resource/survey';
import { TextButton } from 'ui/Button/Button';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';

import { StarRating } from './StarRating';

import './Survey.scss';

export interface ISurveyProps {
    surface: SurveySurfaceType;
    surfaceMeta?: Record<string, any>;
    toastProps: Toast;
}

export const Survey: React.FC<ISurveyProps> = ({
    surface,
    surfaceMeta = {},
    toastProps,
}) => {
    const [survey, setSurvey] = React.useState<ISurvey | null>(null);
    const handleDismiss = React.useCallback(() => {
        toast.dismiss(toastProps.id);
    }, [toastProps.id]);

    const formDOM = !survey ? (
        <SurveyCreationForm
            surface={surface}
            surfaceMeta={surfaceMeta}
            onSurveyCreation={setSurvey}
            onDismiss={handleDismiss}
        />
    ) : (
        <SurveyUpdateForm
            surface={surface}
            survey={survey}
            surfaceMeta={surfaceMeta}
            onSurveyUpdate={setSurvey}
            onDismiss={handleDismiss}
        />
    );

    return (
        <div
            className={clsx(
                'Survey',
                toastProps.visible ? 'Survey-enter' : 'Survey-leave'
            )}
        >
            {formDOM}
        </div>
    );
};

function getSurveyQuestion(
    surface: SurveySurfaceType,
    surfaceMeta: Record<string, any>
) {
    let question = SurveyTypeToQuestion[surface];
    question = question.replace(
        /\{(\w+)\}/g,
        (_, key) => surfaceMeta[key] ?? ''
    );
    return question;
}

const SurveyCreationForm: React.FC<{
    surface: SurveySurfaceType;
    surfaceMeta: Record<string, any>;
    onSurveyCreation: (survey: ISurvey) => any;
    onDismiss: () => any;
}> = ({ surface, surfaceMeta, onSurveyCreation, onDismiss }) => {
    const surveyQuestion = React.useMemo(
        () => getSurveyQuestion(surface, surfaceMeta),
        [surface, surfaceMeta]
    );

    const handleSurveyCreation = React.useCallback(
        async (rating: number) => {
            const createSurveyPromise = SurveyResource.createSurvey({
                surface,
                surface_metadata: surfaceMeta,
                rating,
            });
            toast.promise(createSurveyPromise, {
                loading: 'Submitting response...',
                success: 'Survey recorded. Thanks for your feedback!',
                error: 'Failed to submit survey',
            });
            const { data } = await createSurveyPromise;
            saveSurveyRespondRecord(surface);
            onSurveyCreation(data);
        },
        [onSurveyCreation, surface, surfaceMeta]
    );

    return (
        <>
            <div className="Survey-question">{surveyQuestion}</div>
            <div className="Survey-rating">
                <StarRating onChange={handleSurveyCreation} />
            </div>
            <div className="Survey-actions">
                <TextButton onClick={onDismiss}>Dismiss</TextButton>
            </div>
        </>
    );
};

const SurveyUpdateForm: React.FC<{
    survey: ISurvey;
    onSurveyUpdate: (survey: ISurvey) => any;
    surface: SurveySurfaceType;
    surfaceMeta: Record<string, any>;
    onDismiss: () => any;
}> = ({ surface, onSurveyUpdate, survey, surfaceMeta, onDismiss }) => {
    const [comment, setComment] = React.useState<string>('');

    const surveyQuestion = React.useMemo(
        () => getSurveyQuestion(surface, surfaceMeta),
        [surface, surfaceMeta]
    );

    const handleSurveyUpdate = React.useCallback(
        async (updateForm: IUpdateSurveyFormData) => {
            const updateSurveyPromise = SurveyResource.updateSurvey(
                survey.id,
                updateForm
            );
            toast.promise(updateSurveyPromise, {
                loading: 'Updating survey...',
                success: 'Survey updated. Thanks for your feedback!',
                error: 'Failed to update survey',
            });

            const { data } = await updateSurveyPromise;
            onSurveyUpdate(data);
        },
        [onSurveyUpdate, survey]
    );

    return (
        <>
            <div className="Survey-question">{surveyQuestion}</div>
            <div className="Survey-rating">
                <StarRating
                    onChange={(rating) => handleSurveyUpdate({ rating })}
                    rating={survey.rating}
                />
            </div>

            <div className="Survey-text">
                <ResizableTextArea
                    value={comment}
                    onChange={setComment}
                    placeholder="Please provide additional comments here"
                    rows={2}
                    autoResize={false}
                />
            </div>
            <div className="Survey-actions right-align">
                <TextButton onClick={onDismiss}>Dismiss</TextButton>
                <TextButton
                    onClick={() => handleSurveyUpdate({ comment })}
                    disabled={comment.length === 0}
                >
                    Submit
                </TextButton>
            </div>
        </>
    );
};
