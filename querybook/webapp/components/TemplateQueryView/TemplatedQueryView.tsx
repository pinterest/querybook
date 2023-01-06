import React, { useMemo } from 'react';

import { TDataDocMetaVariables } from 'const/datadoc';
import { IQueryValidationResult } from 'const/queryExecution';
import { useResource } from 'hooks/useResource';
import { getQueryLinePosition, tokenize } from 'lib/sql-helper/sql-lexer';
import { formatError } from 'lib/utils/error';
import NOOP from 'lib/utils/noop';
import { TemplatedQueryResource } from 'resource/queryExecution';
import { Button } from 'ui/Button/Button';
import { ThemedCodeHighlightWithMark } from 'ui/CodeHighlight/ThemedCodeHighlightWithMark';
import { IHighlightRange } from 'ui/CodeHighlight/types';
import { CopyButton } from 'ui/CopyButton/CopyButton';
import { Icon } from 'ui/Icon/Icon';
import { Loading } from 'ui/Loading/Loading';
import { ErrorMessage } from 'ui/Message/ErrorMessage';
import { StyledText } from 'ui/StyledText/StyledText';

import './TemplatedQueryView.scss';

export interface ITemplatedQueryViewProps {
    query: string;
    templatedVariables: TDataDocMetaVariables;
    engineId: number;
    onRunQueryClick?: () => void;
    hasValidator?: boolean;
}

function useValidateQuery(
    renderedQuery: string,
    engineId: number,
    shouldValidate: boolean
) {
    const { data: queryValidationErrors, isLoading } = useResource<
        IQueryValidationResult[]
    >(
        React.useCallback(() => {
            if (!shouldValidate) {
                // The fake promise is needed because
                const fakePromise = Promise.resolve({ data: [] });
                (fakePromise as any).cancel = NOOP;
                return fakePromise;
            }
            return TemplatedQueryResource.validateQuery(
                renderedQuery,
                engineId,
                []
            );
        }, [shouldValidate, renderedQuery, engineId])
    );

    const validationErrorHighlights: IHighlightRange[] = useMemo(() => {
        if (!queryValidationErrors || queryValidationErrors.length === 0) {
            return [];
        }
        const tokens = tokenize(renderedQuery);
        const queryPositions = getQueryLinePosition(renderedQuery);

        return queryValidationErrors
            .map((error) => {
                const token = tokens.find(
                    (token) =>
                        token.line === error.line && token.start === error.ch
                );
                if (token) {
                    return {
                        from: queryPositions[token.line] + token.start,
                        to: queryPositions[token.line] + token.end,
                        className: 'code-highlight-red',
                    };
                }
                return null;
            })
            .filter((x) => x);
    }, [queryValidationErrors, renderedQuery]);

    return {
        validationErrorHighlights,
        queryValidationErrors,
        isValidating: isLoading,
    };
}

export const TemplatedQueryView: React.FC<ITemplatedQueryViewProps> = ({
    query,
    templatedVariables,
    engineId,
    onRunQueryClick,
    hasValidator,
}) => {
    const {
        data: renderedQuery,
        isLoading,
        error,
    } = useResource(
        React.useCallback(
            () =>
                TemplatedQueryResource.renderTemplatedQuery(
                    query,
                    templatedVariables,
                    engineId
                ),
            [query, templatedVariables, engineId]
        )
    );

    const { validationErrorHighlights, queryValidationErrors, isValidating } =
        useValidateQuery(
            renderedQuery,
            engineId,
            !isLoading && !error && hasValidator
        );

    let contentDOM: React.ReactNode = null;
    if (isLoading) {
        contentDOM = <Loading />;
    } else if (error) {
        contentDOM = (
            <div>
                <ErrorMessage title={'Failed to templatize query.'}>
                    {formatError(error)}
                </ErrorMessage>

                <div className="code-wrapper code-error mt16">
                    <ThemedCodeHighlightWithMark query={query} />
                </div>
            </div>
        );
    } else {
        const renderQueryValidationErrors = () => {
            if (isValidating) {
                return (
                    <div className="flex-row pv8">
                        <Icon name="Loading" className="mr8" />
                        <StyledText weight={'bold'}>
                            Validating query...
                        </StyledText>
                    </div>
                );
            }

            if (!queryValidationErrors || queryValidationErrors.length === 0) {
                return null;
            }

            const errorsDOM = queryValidationErrors.map((err, i) => (
                <p key={i}>
                    Line: {err.line} Ch: {err.ch}, Message: {err.message}
                </p>
            ));

            return (
                <ErrorMessage title={'Query contains validation errors'}>
                    {errorsDOM}
                </ErrorMessage>
            );
        };

        contentDOM = (
            <div>
                {renderQueryValidationErrors()}
                <div className="code-wrapper">
                    <ThemedCodeHighlightWithMark
                        query={renderedQuery}
                        highlightRanges={validationErrorHighlights}
                    />
                </div>
                <div className="flex-right mt16">
                    {onRunQueryClick && (
                        <Button
                            icon="Play"
                            title="Run Query"
                            onClick={onRunQueryClick}
                            className="mr4"
                        />
                    )}
                    <CopyButton copyText={renderedQuery} title="Copy" />
                </div>
            </div>
        );
    }

    return <div className="TemplatedQueryView p16">{contentDOM}</div>;
};
