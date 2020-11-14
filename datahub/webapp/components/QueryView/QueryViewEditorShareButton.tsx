import { QueryExecutionAccessList } from 'components/QueryExecutionAccessList/QueryExecutionAccessList';
import React, { useRef, useState } from 'react';
import { Button } from 'ui/Button/Button';
import { Popover } from 'ui/Popover/Popover';
import { IQueryExecution } from 'redux/queryExecutions/types';
import { useSelector, useDispatch } from 'react-redux';
import * as queryExecutionActions from 'redux/queryExecutions/action';
import * as queryExecutionSelectors from 'redux/queryExecutions/selector';
import { IStoreState } from 'redux/store/types';

export const QueryViewEditorShareButton: React.FunctionComponent<{
    queryExecution: IQueryExecution;
}> = ({ queryExecution }) => {
    const dispatch = useDispatch();
    const buttonRef = useRef<HTMLDivElement>(null);
    const [showAccessList, setShowAccessList] = useState(false);

    const accessRequestsByUid = useSelector((state: IStoreState) =>
        queryExecutionSelectors.queryExecutionAccessRequestsByUidSelector(
            state,
            queryExecution.id
        )
    );
    const executionViewersByUid = useSelector((state: IStoreState) =>
        queryExecutionSelectors.queryExecutionViewersByUidSelector(
            state,
            queryExecution.id
        )
    );
    const addQueryExecutionViewer = React.useCallback(
        (uid) => {
            dispatch(
                queryExecutionActions.addQueryExecutionViewer(
                    queryExecution.id,
                    uid
                )
            );
        },
        [queryExecution]
    );

    const deleteQueryExecutionViewer = React.useCallback(
        (uid) => {
            dispatch(
                queryExecutionActions.deleteQueryExecutionViewer(
                    queryExecution.id,
                    uid
                )
            );
        },
        [queryExecution]
    );

    const rejectQueryExecutionAccessRequest = React.useCallback(
        (uid) => {
            dispatch(
                queryExecutionActions.rejectQueryExecutionAccessRequest(
                    queryExecution.id,
                    uid
                )
            );
        },
        [queryExecution]
    );
    const accessRequestsByUidLength = Object.values(accessRequestsByUid).length;

    const shareButton = (
        <Button
            className="share-button"
            title="Share"
            ping={
                accessRequestsByUidLength > 0
                    ? accessRequestsByUidLength.toString()
                    : null
            }
            ref={buttonRef}
            onClick={() => setShowAccessList(!showAccessList)}
        />
    );

    const viewersListDOM = showAccessList && (
        <Popover
            anchor={buttonRef.current}
            onHide={() => setShowAccessList(false)}
            layout={['bottom', 'right']}
            resizeOnChange
        >
            <QueryExecutionAccessList
                accessRequestsByUid={accessRequestsByUid}
                executionViewersByUid={executionViewersByUid}
                queryExecution={queryExecution}
                addQueryExecutionViewer={addQueryExecutionViewer}
                deleteQueryExecutionViewer={deleteQueryExecutionViewer}
                rejectQueryExecutionAccessRequest={
                    rejectQueryExecutionAccessRequest
                }
            />
        </Popover>
    );

    return (
        <div className="QueryViewEditorShareButton">
            {shareButton}
            {viewersListDOM}
        </div>
    );
};
