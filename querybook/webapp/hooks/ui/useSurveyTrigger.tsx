import React, { useRef } from 'react';
import toast from 'react-hot-toast';

import { Survey } from 'components/Survey/Survey';
import { SurveySurfaceType } from 'const/survey';
import {
    saveSurveyTriggerRecord,
    shouldTriggerSurvey,
} from 'lib/survey/triggerLogic';
import { useDebouncedFn } from 'hooks/useDebouncedFn';
import { SURVEY_CONFIG } from 'lib/survey/config';

export async function triggerSurvey(
    surface: SurveySurfaceType,
    surfaceMeta: Record<string, any>
) {
    if (!(await shouldTriggerSurvey(surface))) {
        return;
    }

    await saveSurveyTriggerRecord(surface);

    const toastId = toast.custom(
        (toastProps) => (
            <Survey
                surface={surface}
                surfaceMeta={surfaceMeta}
                toastProps={toastProps}
            />
        ),
        {
            duration: SURVEY_CONFIG[surface].triggerDuration * 1000,
        }
    );

    return toastId;
}

export function useSurveyTrigger(endSurveyOnUnmount: boolean = false) {
    const toastId = useRef<string | null>(null);

    const triggerSurveyHook = useDebouncedFn(
        (surface: SurveySurfaceType, surfaceMeta: Record<string, any>) => {
            if (toastId.current) {
                toast.dismiss(toastId.current);
                toastId.current = null;
            }

            triggerSurvey(surface, surfaceMeta).then(
                (id: string | undefined) => {
                    toastId.current = id;
                }
            );
        },
        500,
        []
    );

    // eslint-disable-next-line arrow-body-style
    React.useEffect(() => {
        return () => {
            if (endSurveyOnUnmount && toastId.current) {
                toast.dismiss(toastId.current);
                toastId.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return triggerSurveyHook;
}
