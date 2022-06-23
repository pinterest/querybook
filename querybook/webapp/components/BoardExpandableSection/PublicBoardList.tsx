import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchBoardIfNeeded } from 'redux/board/action';
import { publicBoardItemsSelector } from 'redux/board/selector';
import { Dispatch, IStoreState } from 'redux/store/types';

import { BoardExpandableHeader } from './BoardExpandableHeader';
import { BoardExpandableList } from './BoardExpandableList';

interface IProps {
    filterString: string;
    selectedDocId: number;
}

export const PublicBoardList: React.FunctionComponent<IProps> = ({
    selectedDocId,
    filterString,
}) => {
    const dispatch: Dispatch = useDispatch();

    const [collapsed, setCollapsed] = React.useState(true);
    const board = useSelector((state: IStoreState) => state.board.boardById[0]);

    React.useEffect(() => {
        if (!collapsed) {
            dispatch(fetchBoardIfNeeded(0));
        }
    }, [collapsed]);

    const boardItemsSelector = React.useMemo(
        () => publicBoardItemsSelector(),
        []
    );
    const items = useSelector((state: IStoreState) =>
        boardItemsSelector(state, 0)
    );

    return (
        <div className="BoardExpandableSection">
            <BoardExpandableHeader
                boardId={0}
                boardName="All Public Lists"
                collapsed={collapsed}
                toggleCollapsed={() => setCollapsed((curr) => !curr)}
                isEditable={false}
            />
            {!collapsed && (
                <BoardExpandableList
                    selectedDocId={selectedDocId}
                    filterString={filterString}
                    boardId={0}
                    items={items}
                />
            )}
        </div>
    );
};
