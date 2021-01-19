import React, { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { titleize } from 'lib/utils';
import { getAppName } from 'lib/utils/global';

import { generateFormattedDate } from 'lib/utils/datetime';
import { fetchSystemStatus } from 'redux/queryEngine/action';
import { IStoreState } from 'redux/store/types';

import { IconButton } from 'ui/Button/IconButton';
import { FormSectionHeader } from 'ui/Form/FormField';
import { Loading } from 'ui/Loading/Loading';
import { Markdown } from 'ui/Markdown/Markdown';
import { Message, MessageType } from 'ui/Message/Message';
import { Level } from 'ui/Level/Level';
import { QueryEngineStatus } from 'const/queryEngine';
import { Title } from 'ui/Title/Title';

import './QueryEngineStatusViewer.scss';

interface IProps {
    engineId: number;
}

export const QueryEngineStatusViewer: React.FC<IProps> = ({ engineId }) => {
    const queryEngine = useSelector(
        (state: IStoreState) => state.queryEngine.queryEngineById[engineId]
    );
    const queryEngineStatus = useSelector(
        (state: IStoreState) =>
            state.queryEngine.queryEngineStatusById[engineId]
    );

    const dispatch = useDispatch();
    const loadSystemStatus = useCallback(
        () => dispatch(fetchSystemStatus(engineId, true)),
        [engineId]
    );

    useEffect(() => {
        if (!queryEngineStatus && queryEngine) {
            loadSystemStatus();
        }
    }, [queryEngineStatus, queryEngine]);

    let contentDOM: React.ReactChild = null;

    if (!queryEngine) {
        contentDOM = <span>Invalid Query Engine</span>;
    } else if (!queryEngineStatus || queryEngineStatus.loading) {
        contentDOM = <Loading />;
    } else if (queryEngineStatus.failed) {
        contentDOM = <span>Failed to fetch</span>;
    } else if (queryEngineStatus.data) {
        const header = (
            <Level>
                <div>
                    <Title inline>{titleize(queryEngine.name)}</Title>
                    <IconButton icon="refresh-cw" onClick={loadSystemStatus} />
                </div>
                <div>
                    Updated at:{' '}
                    {generateFormattedDate(queryEngineStatus.updated_at, 'X')}
                </div>
            </Level>
        );
        const { data } = queryEngineStatus;

        let messageType: MessageType = 'info';
        let infoTitle = 'Cannot verify engine status';
        let infoMessage = 'Engine status is unknown.';
        if (data.status === QueryEngineStatus.GOOD) {
            messageType = 'success';
            infoTitle = 'Engine is healthy!';
            infoMessage = 'Your query should finish normally.';
        } else if (data.status === QueryEngineStatus.WARN) {
            messageType = 'warning';
            infoTitle = 'Engine has minor issues.';
            infoMessage = `Your query may take longer than expected.`;
        } else if (data.status === QueryEngineStatus.ERROR) {
            messageType = 'error';
            infoTitle = `${getAppName()} cannot connect to engine.`;
            infoMessage =
                'Running queries on this engine will most likely result in failure.';
        }

        const statusSectionDOM = (
            <div>
                <FormSectionHeader>Status</FormSectionHeader>
                <Message
                    title={infoTitle}
                    message={infoMessage}
                    type={messageType}
                />
            </div>
        );

        const messageDOMs = (data.messages ?? []).map((message, index) => (
            <Message key={index} type={messageType}>
                <Markdown>{message}</Markdown>
            </Message>
        ));
        const messageSectionDOM = messageDOMs.length ? (
            <div>
                <FormSectionHeader>Info</FormSectionHeader>
                {messageDOMs}
            </div>
        ) : null;

        contentDOM = (
            <>
                {header}
                {statusSectionDOM}
                {messageSectionDOM}
            </>
        );
    }

    return <div className="QueryEngineStatusViewer">{contentDOM}</div>;
};
