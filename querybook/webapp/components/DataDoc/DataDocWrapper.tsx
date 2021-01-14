import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { DataDoc } from './DataDoc';

export const DataDocWrapper: React.FunctionComponent<RouteComponentProps> = ({
    match,
}) => {
    const docId = Number(match.params['docId']);
    return <DataDoc docId={docId} />;
};
