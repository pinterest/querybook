import React from 'react';

export interface IColumnDetector {
    type: string;
    // can be any number, higher number gets called first
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

    // this determines the order of transformers
    // in the menu. Higher priority is shown first
    priority: number;
    // if auto, then transformer is turned on by default
    auto: boolean;

    transform: (v: any) => React.ReactNode;
}
