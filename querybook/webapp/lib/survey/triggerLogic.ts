import { SURVEY_CONFIG } from './config';
import type { ISurveyLocalRecord, SurveyTime } from './types';
import localStore from 'lib/local-store';
import { SURVEY_RECORD_KEY, TSurveyRecord } from 'lib/local-store/const';
import { SurveySurfaceType } from 'const/survey';

/**
 *
 * @param now current time in seconds
 * @param surface name of surface, assumed to be in survey config
 * @returns boolean indicating whether survey should be triggered
 */
export async function shouldTriggerSurvey(
    surface: SurveySurfaceType
): Promise<boolean> {
    if (!SURVEY_CONFIG[surface]) {
        return false;
    }

    const now = getSurveyTime();
    const record = await getLocalRecord(surface);
    const surveyConfig = SURVEY_CONFIG[surface];

    // check if triggered too recently
    if (now.nowSeconds - record.lastTriggered < surveyConfig.triggerCooldown) {
        return false;
    }

    // check if responded too recently
    if (now.nowSeconds - record.lastResponded < surveyConfig.responseCooldown) {
        return false;
    }

    // check if triggered too many times this week
    if (
        record.weekTriggered[0] === now.weekOfYear &&
        record.weekTriggered[1] >= surveyConfig.maxPerWeek
    ) {
        return false;
    }

    // check if triggered too many times this day
    if (
        record.dayTriggered[0] === now.dayOfYear &&
        record.dayTriggered[1] >= surveyConfig.maxPerDay
    ) {
        return false;
    }

    return true;
}

async function retrieveAndUpdateRecord(
    surface: SurveySurfaceType,
    callback: (record: ISurveyLocalRecord) => ISurveyLocalRecord
) {
    const record = await getLocalRecord(surface);
    const updatedRecord = callback(record);

    await localStore.set<TSurveyRecord>(SURVEY_RECORD_KEY, {
        ...(await localStore.get<TSurveyRecord>(SURVEY_RECORD_KEY)),
        [surface]: updatedRecord,
    });
}

export async function saveSurveyTriggerRecord(surface: SurveySurfaceType) {
    const now = getSurveyTime();
    await retrieveAndUpdateRecord(surface, (record) => {
        // update last triggered
        record.lastTriggered = now.nowSeconds;

        // update triggered count for this week
        if (record.weekTriggered[0] === now.weekOfYear) {
            record.weekTriggered[1] += 1;
        } else {
            record.weekTriggered = [now.weekOfYear, 1];
        }

        // update triggered count for this day
        if (record.dayTriggered[0] === now.dayOfYear) {
            record.dayTriggered[1] += 1;
        } else {
            record.dayTriggered = [now.dayOfYear, 1];
        }

        return record;
    });
}

export async function saveSurveyRespondRecord(surface: SurveySurfaceType) {
    const now = getSurveyTime();
    await retrieveAndUpdateRecord(surface, (record) => {
        // update last responded
        record.lastResponded = now.nowSeconds;

        return record;
    });
}

async function getLocalRecord(
    surface: SurveySurfaceType
): Promise<ISurveyLocalRecord> {
    const localRecord = await localStore.get<TSurveyRecord>(SURVEY_RECORD_KEY);
    return {
        lastTriggered: 0,
        lastResponded: 0,
        weekTriggered: [0, 0],
        dayTriggered: [0, 0],

        ...(localRecord?.[surface] ?? {}),
    };
}

function getSurveyTime(): SurveyTime {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor(
        (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weekOfYear = Math.floor(dayOfYear / 7);
    return {
        nowSeconds: Math.floor(now.getTime() / 1000),
        weekOfYear,
        dayOfYear,
    };
}
