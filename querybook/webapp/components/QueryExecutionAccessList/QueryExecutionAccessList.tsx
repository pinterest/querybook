import React from 'react';
import toast from 'react-hot-toast';

import { IQueryExecutionViewer } from 'const/queryExecution';
import { IAccessRequest } from 'const/accessRequest';
import { UserSelect } from 'components/UserSelect/UserSelect';
import { IQueryExecution } from 'redux/queryExecutions/types';
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
        <div className="query-execution-add-user-row horizontal-space-between">
            <div className="user-select-wrapper mr8">
                <UserSelect
                    onSelect={(uid) => {
                        if (
                            uid in executionViewersByUid ||
                            uid === queryExecution.uid
                        ) {
                            toast.error('User already added.');
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
        <div className="mb4">
            <Title size={6} subtitle>
                Add User
            </Title>
        </div>
    );
    const accessRequestListDOM = Object.values(accessRequestsByUid).map(
        (request) => (
            <div key={request.uid} className="viewers-user-row">
                <div className="user-badge-wrapper">
                    <UserBadge uid={request.uid} />
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

    const viewersListDOM = Object.values(executionViewersByUid).map(
        (viewer) => (
            <div key={viewer.uid} className="viewers-user-row">
                <div className="user-badge-wrapper">
                    <UserBadge uid={viewer.uid} />
                </div>
                <Button
                    className="remove-button"
                    size="small"
                    title="Remove"
                    onClick={() => deleteQueryExecutionViewer(viewer.uid)}
                />
            </div>
        )
    );

    const accessRequestHeader =
        accessRequestListDOM.length > 0 ? (
            <div className="row-description mr16 mb4">
                <Title size={6} subtitle>
                    Access Requests
                </Title>
            </div>
        ) : null;

    const viewersListHeader =
        viewersListDOM.length > 0 ? (
            <div className="row-description mr16 mb4">
                <Title size={6} subtitle>
                    Users With Access
                </Title>
            </div>
        ) : null;

    const contentDOM = (
        <div>
            {accessRequestHeader}
            <div className="viewers-list-wrapper">{accessRequestListDOM}</div>
            {viewersListHeader}
            <div className="viewers-list-wrapper">{viewersListDOM}</div>
        </div>
    );
    return (
        <div className="QueryExecutionAccessList p8">
            {shareHeader}
            {addUserRowDOM}
            {contentDOM}
        </div>
    );
};
