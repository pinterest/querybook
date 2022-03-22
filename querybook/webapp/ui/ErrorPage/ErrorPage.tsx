import React from 'react';
import clsx from 'clsx';

import history from 'lib/router-history';
import { Center } from 'ui/Center/Center';
import { Subtitle, Title } from 'ui/Title/Title';
import { FullHeight } from 'ui/FullHeight/FullHeight';

import './ErrorPage.scss';

interface IErrorPageProps {
    className?: string;
    errorCode?: number;
    errorTitle?: string;
    errorMessage?: any;
}

const httpCodeToString = {
    404: 'Not Found',
    403: 'Forbidden',
};

const httpCodeToDescription = {
    404: 'No match for',
    403: 'You are not allowed to access',
};

export const ErrorPage: React.FunctionComponent<IErrorPageProps> = ({
    className,
    children,
    errorMessage,
    errorCode,
    errorTitle,
}) => {
    if (!errorTitle) {
        errorTitle =
            errorCode in httpCodeToString
                ? `${errorCode}: ${httpCodeToString[errorCode]}`
                : 'Unknown Error';
    }

    const message = errorMessage ? (
        errorMessage
    ) : (
        <>
            {httpCodeToDescription[errorCode] || 'Unknown error occured at'}
            <code className="ErrorPage-path ml4">{location.pathname}</code>.
            <span className="ml4">
                Click <a onClick={history.goBack}>here</a> to go back.
            </span>
        </>
    );

    const classNameProp = clsx({
        ErrorPage: true,
        [className]: className,
    });

    return (
        <FullHeight className={classNameProp}>
            <Center className="flex-column">
                <Title size="xxlarge" className="mb24">
                    {errorTitle}
                </Title>
                <Subtitle className="ErrorPage-message mb16">
                    {message}
                </Subtitle>
                {children}
            </Center>
        </FullHeight>
    );
};
