export interface ISurveyConfig {
    surface: string;
    responseCooldown: number;
    triggerCooldown: number;
    triggerDuration: number;
    maxPerWeek: number;
    maxPerDay: number;
}

export interface ISurveyLocalRecord {
    lastTriggered: number;
    lastResponded: number;
    weekTriggered: [weekNum: number, count: number];
    dayTriggered: [dayNum: number, count: number];
}

export interface SurveyTime {
    nowSeconds: number;
    weekOfYear: number;
    dayOfYear: number;
}
