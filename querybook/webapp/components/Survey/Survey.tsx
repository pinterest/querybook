import clsx from 'clsx';
import React from 'react';
import toast, { Toast } from 'react-hot-toast';

import { ComponentType } from 'const/analytics';
import {
    ISurvey,
    IUpdateSurveyFormData,
    SurveySurfaceType,
    SurveyTypeToQuestion,
} from 'const/survey';
import { useTrackView } from 'hooks/useTrackView';
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
    useTrackView(ComponentType.SURVEY, undefined, {
        surface,
        meta: surfaceMeta,
    });

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

/**
 * Render the question with templated vars in surfaceMeta
 * Note that templated variable must have format `{varName}`
 *
 * for example "Do you trust {table}" rendered with surfaceMeta = { "table": "foo.bar" }
 * becomes "Do you trust foo.bar"
 *
 * @param surface must be in SurveyTypeToQuestion
 * @param surfaceMeta
 * @returns
 */
function getSurveyQuestion(
    surface: SurveySurfaceType,
    surfaceMeta: Record<string, any>
) {
    return SurveyTypeToQuestion[surface].replace(
        /\{(\w+)\}/g,
        (_, key) => surfaceMeta[key] ?? ''
    );
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
                    placeholder="(Optional) Provide additional comments here"
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
