import React from 'react';
import toast from 'react-hot-toast';

import { ISurvey, IUpdateSurveyFormData } from 'const/survey';
import { saveSurveyRespondRecord } from 'lib/survey/triggerLogic';
import { SurveyResource } from 'resource/survey';
import { Button } from 'ui/Button/Button';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';

import { StarRating } from './StarRating';
import SurveyQuestion from './surveyQuestion';

export interface ISurveyProps {
    surface: string;
    surfaceMeta?: Record<string, any>;
}

export const Survey: React.FC<ISurveyProps> = ({
    surface,
    surfaceMeta = {},
}) => {
    const [survey, setSurvey] = React.useState<ISurvey | null>(null);

    return !survey ? (
        <SurveyCreationForm
            surface={surface}
            surfaceMeta={surfaceMeta}
            onSurveyCreation={setSurvey}
        />
    ) : (
        <SurveyUpdateForm
            surface={surface}
            survey={survey}
            onSurveyUpdate={setSurvey}
        />
    );
};

const SurveyCreationForm: React.FC<
    ISurveyProps & { onSurveyCreation: (survey: ISurvey) => any }
> = ({ surface, surfaceMeta, onSurveyCreation }) => {
    const surveyQuestion = SurveyQuestion[surface];

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
        <div>
            <div>{surveyQuestion}</div>
            <StarRating onChange={handleSurveyCreation} />
        </div>
    );
};

const SurveyUpdateForm: React.FC<{
    survey: ISurvey;
    onSurveyUpdate: (survey: ISurvey) => any;
    surface: string;
}> = ({ surface, onSurveyUpdate, survey }) => {
    const [comment, setComment] = React.useState<string>('');

    const surveyQuestion = SurveyQuestion[surface];

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
        <div>
            <div className="mb4">{surveyQuestion}</div>
            <StarRating
                onChange={(rating) => handleSurveyUpdate({ rating })}
                rating={survey.rating}
            />
            <div className="mt8">
                <ResizableTextArea
                    value={comment}
                    onChange={setComment}
                    placeholder="Please provide additional comments here"
                    rows={3}
                />
                <div className="right-align">
                    <Button onClick={() => handleSurveyUpdate({ comment })}>
                        Submit
                    </Button>
                </div>
            </div>
        </div>
    );
};
