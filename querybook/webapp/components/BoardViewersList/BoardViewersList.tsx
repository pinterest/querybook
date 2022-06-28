import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { updateBoard } from 'redux/board/action';
import { Dispatch, IStoreState } from 'redux/store/types';

import { StyledText } from 'ui/StyledText/StyledText';
import { Tabs } from 'ui/Tabs/Tabs';

import './BoardViewersList.scss';

interface IProps {
    boardId: number;
}

// TODO meowcodes: implement viewer's list ui + editor apis
export const BoardViewersList: React.FunctionComponent<IProps> = ({
    boardId,
}) => {
    const dispatch: Dispatch = useDispatch();

    const board = useSelector(
        (state: IStoreState) => state.board.boardById[boardId]
    );
    const handlePublicToggle = React.useCallback(
        (selectedTabKey) => {
            dispatch(
                updateBoard(
                    board.id,
                    board.name,
                    selectedTabKey === 'Public',
                    board.description
                )
            );
        },
        [board, dispatch]
    );

    const publicRow = (
        <>
            <div className="public-row-switch">
                <Tabs
                    selectedTabKey={board.public ? 'Public' : 'Private'}
                    pills
                    align="center"
                    items={['Private', 'Public']}
                    onSelect={handlePublicToggle}
                    // disabled={readonly}
                />
            </div>
            <div className="flex-column">
                <StyledText color="light" noUserSelect>
                    {board.public
                        ? 'This list can be viewed by anyone'
                        : 'Only invited users can view this list'}
                </StyledText>
                {/* {isEditor ? null : (
                    <div className="mt12">
                        <AccessRequestButton
                            onAccessRequest={handleDataDocAccessRequest}
                            isEdit
                        />
                    </div>
                )} */}
            </div>
        </>
    );
    return <div className="BoardViewersList">{publicRow}</div>;
};
