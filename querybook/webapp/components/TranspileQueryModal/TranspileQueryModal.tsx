import React, { useCallback } from 'react';

import { IQueryEngine } from 'const/queryEngine';
import { useResource } from 'hooks/useResource';
import { TemplatedQueryResource } from 'resource/queryExecution';
import { Button } from 'ui/Button/Button';
import { Loading } from 'ui/Loading/Loading';
import { Modal } from 'ui/Modal/Modal';

import { QueryComparison } from './QueryComparison';

interface IProps {
    query: string;
    transpilerName: string;
    toEngine: IQueryEngine;
    fromEngine: IQueryEngine;

    onTranspileConfirm: (query: string, engine: IQueryEngine) => void;
    onHide: () => void;
}

export const TranspileQueryModal: React.FC<IProps> = ({
    query,
    transpilerName,
    toEngine,
    fromEngine,
    onHide,
    onTranspileConfirm,
}) => {
    const { data: transpiledQuery, isLoading } = useResource(
        useCallback(
            () =>
                TemplatedQueryResource.transpileQuery(
                    transpilerName,
                    query,
                    fromEngine.language,
                    toEngine.language
                ),
            [transpilerName, query, fromEngine, toEngine]
        )
    );

    let contentDOM = null;
    let bottomDOM = null;
    if (isLoading) {
        contentDOM = <Loading />;
    } else {
        contentDOM = (
            <QueryComparison
                fromQuery={query}
                toQuery={transpiledQuery}
                fromEngine={fromEngine}
                toEngine={toEngine}
            />
        );

        bottomDOM = (
            <div className="right-align mb16">
                <Button title="Cancel" onClick={onHide} />
                <Button
                    title="Confirm"
                    color="confirm"
                    onClick={() =>
                        onTranspileConfirm(transpiledQuery, toEngine)
                    }
                />
            </div>
        );
    }

    return (
        <Modal onHide={onHide} bottomDOM={bottomDOM}>
            {contentDOM}
        </Modal>
    );
};
