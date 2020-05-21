import React from 'react';
import classNames from 'classnames';

import history from 'lib/router-history';
import { Center } from 'ui/Center/Center';
import { Title } from 'ui/Title/Title';
import { FullHeight } from 'ui/FullHeight/FullHeight';

import './ErrorPage.scss';

interface IErrorPageProps {
    className?: string;
    errorCode?: number;
    errorTitle?: string;
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
    errorCode,
    errorTitle,
}) => {
    if (!errorTitle) {
        errorTitle =
            errorCode in httpCodeToString
                ? `${errorCode}: ${httpCodeToString[errorCode]}`
                : 'Unknown Error';
    }

    const message = children ? (
        children
    ) : (
        <>
            {httpCodeToDescription[errorCode] || 'Unknown error occured at'}
            <code className="ErrorPage-path ml4">{location.pathname}</code>.
            <span className="ml4">
                Click <a onClick={history.goBack}>here</a> to go back.
            </span>
        </>
    );

    return (
        <FullHeight
            className={classNames({ ErrorPage: true, [className]: className })}
        >
            <Center>
                <Title size={2}>{errorTitle}</Title>
                <Title subtitle size={6} className="ErrorPage-message">
                    {message}
                </Title>
            </Center>
        </FullHeight>
    );
};
