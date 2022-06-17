import React from 'react';

import { ErrorPage } from 'ui/ErrorPage/ErrorPage';

interface IErrorBoundaryState {
    hasError: boolean;
    errorString: string;
}

function stringifyError(errorObj: any): string {
    if (errorObj == null) {
        return 'Null error';
    } else if (errorObj instanceof TypeError) {
        return `${errorObj.message}\n${errorObj.stack}`;
    }

    return JSON.stringify(errorObj);
}

export class ErrorBoundary extends React.PureComponent<
    unknown,
    IErrorBoundaryState
> {
    public readonly state = {
        hasError: false,
        errorString: '',
    };

    public componentDidCatch(errorObj, info) {
        this.setState({
            hasError: true,
            errorString: stringifyError(errorObj),
        });
    }

    public render() {
        const { hasError, errorString } = this.state;

        if (hasError) {
            return (
                <ErrorPage
                    errorTitle={'Unexpected Frontend Error'}
                    errorMessage={errorString}
                />
            );
        }

        return this.props.children;
    }
}
