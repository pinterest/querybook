import * as React from 'react';
import { useDispatch } from 'react-redux';

import { fetchBoardIfNeeded } from 'redux/board/action';
import { Dispatch } from 'redux/store/types';

import { BoardExpandableHeader } from './BoardExpandableHeader';

export const PublicBoardList: React.FunctionComponent = () => {
    const dispatch: Dispatch = useDispatch();

    const [collapsed, setCollapsed] = React.useState(true);

    React.useEffect(() => {
        if (!collapsed) {
            dispatch(fetchBoardIfNeeded(0));
        }
    }, [collapsed]);

    return (
        <div className="BoardExpandableSection">
            <BoardExpandableHeader
                boardId={0}
                boardName="All Public Lists"
                collapsed={collapsed}
                toggleCollapsed={() => setCollapsed((curr) => !curr)}
                isEditable={false}
            />
        </div>
    );
};
