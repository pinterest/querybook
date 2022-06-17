import React from 'react';

import { ErrorPage } from './ErrorPage';

export const FourOhThree: React.FunctionComponent = ({ children }) => (
    <ErrorPage errorCode={403} errorMessage={children} />
);
