import React from 'react';
import toast from 'react-hot-toast';

import { UserBadge } from 'components/UserBadge/UserBadge';
import { UserSelect } from 'components/UserSelect/UserSelect';
import { IAccessRequest } from 'const/accessRequest';
import { IQueryExecution, IQueryExecutionViewer } from 'const/queryExecution';
import { Button } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { Subtitle } from 'ui/Title/Title';

import './QueryExecutionAccessList.scss';

interface IQueryExecutionAccessListProps {
    accessRequestsByUid: Record<number, IAccessRequest>;
    executionViewersByUid: Record<number, IQueryExecutionViewer>;
    queryExecution: IQueryExecution;

    addQueryExecutionViewer: (uid: number) => any;
    deleteQueryExecutionViewer: (uid: number) => any;
    rejectQueryExecutionAccessRequest: (uid: number) => any;
}

export const QueryExecutionAccessList: React.FunctionComponent<
    IQueryExecutionAccessListProps
> = ({
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
            <Subtitle>Add User</Subtitle>
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
                            icon="CheckCircle"
                            onClick={() => addQueryExecutionViewer(request.uid)}
                        />
                        <IconButton
                            className="access-request-control-button"
                            icon="XCircle"
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
                <Subtitle>Access Requests</Subtitle>
            </div>
        ) : null;

    const viewersListHeader =
        viewersListDOM.length > 0 ? (
            <div className="row-description mr16 mb4">
                <Subtitle>Users With Access</Subtitle>
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
