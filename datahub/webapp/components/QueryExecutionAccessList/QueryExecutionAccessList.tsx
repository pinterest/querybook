import React, { useState } from 'react';
import { IQueryExecutionViewer } from 'const/queryExecution';
import { IAccessRequest } from 'const/accessRequest';
import { UserSelect } from 'components/UserSelect/UserSelect';
import { IQueryExecution } from 'redux/queryExecutions/types';
import { sendNotification } from 'lib/dataHubUI';
import { UserBadge } from 'components/UserBadge/UserBadge';
import { Button } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import './QueryExecutionAccessList.scss';
import { Title } from 'ui/Title/Title';

interface IQueryExecutionAccessListProps {
    accessRequestsByUid: Record<number, IAccessRequest>;
    executionViewersByUid: Record<number, IQueryExecutionViewer>;
    queryExecution: IQueryExecution;

    addQueryExecutionViewer: (uid: number) => any;
    deleteQueryExecutionViewer: (uid: number) => any;
    rejectQueryExecutionAccessRequest: (uid: number) => any;
}

export const QueryExecutionAccessList: React.FunctionComponent<IQueryExecutionAccessListProps> = ({
    accessRequestsByUid,
    executionViewersByUid,
    queryExecution,

    addQueryExecutionViewer,
    deleteQueryExecutionViewer,
    rejectQueryExecutionAccessRequest,
}) => {
    const addUserRowDOM = (
        <div className="query-execution-add-user-row">
            <div className="user-select-wrapper">
                <UserSelect
                    onSelect={(uid) => {
                        if (
                            uid in executionViewersByUid ||
                            uid === queryExecution.uid
                        ) {
                            sendNotification('User already added.');
                        } else {
                            addQueryExecutionViewer(uid);
                        }
                    }}
                    selectProps={{
                        isClearable: true,
                    }}
                    clearAfterSelect
                />
            </div>
        </div>
    );
    const shareHeader = (
        <div className="row-description">
            <Title size={6} subtitle>
                Add User
            </Title>
        </div>
    );
    const accessRequestListDOM = Object.values(accessRequestsByUid).map(
        (request) => (
            <div key={request.uid} className="viewers-user-row">
                <div className="user-badge-wrapper">
                    <UserBadge isOnline={undefined} uid={request.uid} />
                </div>
                <div className="access-info">
                    <div className="access-request-control-buttons flex-row">
                        <IconButton
                            className="access-request-control-button"
                            icon="check-circle"
                            onClick={() => addQueryExecutionViewer(request.uid)}
                        />
                        <IconButton
                            className="access-request-control-button"
                            icon="x-circle"
                            onClick={() =>
                                rejectQueryExecutionAccessRequest(request.uid)
                            }
                        />
                    </div>
                </div>
            </div>
        )
    );

    const accessRequestHeader =
        Object.values(accessRequestsByUid).length > 0 ? (
            <div className="row-description">
                <Title size={6} subtitle>
                    Access Requests
                </Title>
            </div>
        ) : null;

    const viewersListHeader =
        Object.values(executionViewersByUid).length > 0 ? (
            <div className="row-description">
                <Title size={6} subtitle>
                    Users With Access
                </Title>
            </div>
        ) : null;

    const viewersListDOM = Object.values(executionViewersByUid).map(
        (viewer) => (
            <div key={viewer.uid} className="viewers-user-row">
                <div className="user-badge-wrapper">
                    <UserBadge isOnline={undefined} uid={viewer.uid} />
                </div>
                <Button
                    small
                    title="Remove"
                    onClick={() => deleteQueryExecutionViewer(viewer.uid)}
                />
            </div>
        )
    );

    const contentDOM = (
        <div>
            <div className="viewers-list-wrapper">
                {accessRequestHeader}
                {accessRequestListDOM}
                {viewersListHeader}
                {viewersListDOM}
            </div>
        </div>
    );
    return (
        <div className="QueryExecutionAccessList">
            {shareHeader}
            {addUserRowDOM}
            {contentDOM}
        </div>
    );
};
