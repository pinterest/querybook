import * as React from 'react';
import { useSelector } from 'react-redux';

import { BoardBoardItem } from 'components/Board/BoardBoardItem';
import { BoardPageContext, IBoardPageContextType } from 'context/BoardPage';
import { BoardResource } from 'resource/board';
import { IStoreState } from 'redux/store/types';
import { AccentText, EmptyText } from 'ui/StyledText/StyledText';
import { Button } from 'ui/Button/Button';

const BOARDS_PER_PAGE = 20;

export const PublicBoardPage: React.FunctionComponent = () => {
    const environmentId = useSelector(
        (state: IStoreState) => state.environment.currentEnvironmentId
    );

    const [boardIds, setBoardIds] = React.useState<number[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [hasMore, setHasMore] = React.useState(true);
    const offset = React.useRef(0);

    const boardContextValue: IBoardPageContextType = React.useMemo(
        () => ({
            onDeleteBoardItem: () => null,
            isEditMode: false,
            isCollapsed: false,
            boardId: 0,
        }),
        []
    );

    const loadMoreBoards = React.useCallback(async () => {
        if (!environmentId || loading) {
            return;
        }

        setLoading(true);
        try {
            const response = await BoardResource.getAllPublic(
                environmentId,
                BOARDS_PER_PAGE,
                offset.current
            );

            const newBoardIds = response.data.boards as unknown as number[];

            setBoardIds((prevIds) => {
                const updated = [...prevIds, ...newBoardIds];
                offset.current = updated.length;
                return updated;
            });
            setHasMore(newBoardIds.length === BOARDS_PER_PAGE);
        } catch (error) {
            console.error('Failed to load public boards:', error);
        } finally {
            setLoading(false);
        }
    }, [environmentId]);

    React.useEffect(() => {
        if (environmentId && boardIds.length === 0 && !loading) {
            offset.current = 0;
            loadMoreBoards();
        }
    }, [environmentId, loadMoreBoards]);

    // Reset state when environment changes
    React.useEffect(() => {
        setBoardIds([]);
        setHasMore(true);
        offset.current = 0;
    }, [environmentId]);

    const boardItemRenderer = React.useCallback(
        (boardId: number) => <BoardBoardItem boardId={boardId} key={boardId} />,
        []
    );

    const boardItemDOM =
        boardIds.length === 0 ? (
            <EmptyText className="m24">No public lists found.</EmptyText>
        ) : (
            <div>
                {boardIds.map(boardItemRenderer)}
                {hasMore && (
                    <div className="flex-center mt16">
                        <Button
                            onClick={() => {
                                loadMoreBoards();
                            }}
                            disabled={loading}
                            theme="text"
                        >
                            {loading ? 'Loading...' : 'Load More'}
                        </Button>
                    </div>
                )}
            </div>
        );

    return (
        <BoardPageContext.Provider value={boardContextValue}>
            <div className="Board">
                <div className="Board-content">
                    <AccentText
                        className="p8"
                        color="light"
                        size="xlarge"
                        weight="extra"
                    >
                        All Public Lists
                    </AccentText>
                    {boardItemDOM}
                </div>
            </div>
        </BoardPageContext.Provider>
    );
};
