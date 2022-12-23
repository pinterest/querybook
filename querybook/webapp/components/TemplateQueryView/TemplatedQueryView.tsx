import React from 'react';

import { TDataDocMetaVariables } from 'const/datadoc';
import { useResource } from 'hooks/useResource';
import { formatError } from 'lib/utils/error';
import { TemplatedQueryResource } from 'resource/queryExecution';
import { Button } from 'ui/Button/Button';
import { ThemedCodeHighlight } from 'ui/CodeHighlight/ThemedCodeHighlight';
import { CopyButton } from 'ui/CopyButton/CopyButton';
import { Loading } from 'ui/Loading/Loading';
import { ErrorMessage } from 'ui/Message/ErrorMessage';

import './TemplatedQueryView.scss';

export interface ITemplatedQueryViewProps {
    query: string;
    templatedVariables: TDataDocMetaVariables;
    engineId: number;
    onRunQueryClick?: () => void;
}

export const TemplatedQueryView: React.FC<ITemplatedQueryViewProps> = ({
    query,
    templatedVariables,
    engineId,
    onRunQueryClick,
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
                    <ThemedCodeHighlight value={query} />
                </div>
            </div>
        );
    } else {
        contentDOM = (
            <div>
                <div className="code-wrapper">
                    <ThemedCodeHighlight value={renderedQuery} />
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
