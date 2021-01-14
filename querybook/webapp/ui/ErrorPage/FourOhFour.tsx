import React from 'react';

import { ErrorPage } from 'ui/ErrorPage/ErrorPage';

export const FourOhFour: React.FunctionComponent = ({ children }) => (
    <ErrorPage errorCode={404} errorMessage={children} />
);
