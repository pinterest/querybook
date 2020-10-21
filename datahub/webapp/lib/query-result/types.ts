import React from 'react';

export interface IColumnDetector {
    type: string;
    priority: number;
    checker: (colName: string, values: any[]) => boolean;
}

export interface IColumnStatsAnalyzer {
    key: string;
    name: string;
    appliesToType: string[];
    generator: (values: any[]) => string;
}

export interface IColumnTransformer {
    key: string;
    name: string;

    appliesToType: string[];
    priority: number;
    auto: boolean;

    transform: (v: any) => React.ReactNode;
}
