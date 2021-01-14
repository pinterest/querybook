import React, { useMemo } from 'react';
import { Markdown } from 'ui/Markdown/Markdown';
import { Message } from 'ui/Message/Message';

const queryErrorsByLanguage: Record<
    string,
    Record<
        string,
        {
            regex: string;
            message: string;
        }
    >
> = require('config/query_error.yaml');

const errorSuggestionInfoByLanguage = Object.entries(
    queryErrorsByLanguage
).reduce((hash, [language, queryErrors]) => {
    hash[language] = Object.entries(queryErrors).reduce(
        (innerHash, [errorName, error]) => {
            innerHash[errorName] = {
                ...error,
                regex: new RegExp(error.regex, 'i'),
            };
            return innerHash;
        },
        {}
    );
    return hash;
}, {});
interface IProps {
    errorMsg: string;
    language: string;
}

export const ErrorSuggestion: React.FunctionComponent<IProps> = ({
    errorMsg,
    language,
}) => {
    const errorSuggestionInfo = useMemo(
        () => ({
            ...errorSuggestionInfoByLanguage[language],
            ...errorSuggestionInfoByLanguage['common'],
        }),
        [language]
    );

    let matchedError;
    for (const errorName in errorSuggestionInfo) {
        if (errorSuggestionInfo.hasOwnProperty(errorName)) {
            const error = errorSuggestionInfo[errorName];
            if (error.regex.test(errorMsg)) {
                matchedError = error;
                break;
            }
        }
    }

    return matchedError ? (
        <Message
            className="ErrorSuggestion"
            icon="zap"
            iconSize={20}
            type="tip"
        >
            <Markdown>{matchedError.message}</Markdown>
        </Message>
    ) : null;
};
