import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { Dispatch } from 'redux/store/types';
import { addBoardItem, deleteBoardItem } from 'redux/board/action';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { TooltipDirection } from 'const/tooltip';
import { useDataFetch } from 'hooks/useDataFetch';

import { IconButton, IIconButtonProps } from 'ui/Button/IconButton';
import { BoardItemType, IBoardRaw } from 'const/board';

import { Popover, PopoverLayout } from 'ui/Popover/Popover';
import { BoardCreateUpdateModal } from 'components/BoardCreateUpdateModal/BoardCreateUpdateModal';
import { BoardList } from 'components/BoardList/BoardList';

import './BoardItemAddButton.scss';
import { Loading } from 'ui/Loading/Loading';

export interface ICreateDataDocButtonProps extends Partial<IIconButtonProps> {
    // from own Props
    tooltipPos?: TooltipDirection;
    tooltip?: string;
    popoverLayout?: PopoverLayout;
    itemId: number;
    itemType: BoardItemType;
}

export const BoardItemAddButton: React.FunctionComponent<ICreateDataDocButtonProps> = ({
    tooltip = 'Add to list',
    popoverLayout = ['right', 'top'],
    itemId,
    itemType,

    ...IIconButtonProps
}) => {
    const selfRef = useRef<HTMLAnchorElement>(null);

    const environment = useSelector(currentEnvironmentSelector);
    // Loads all boards that has this item owned by the user
    const {
        data: boardIds,
        forceFetch: fetchBoardIds,
        isLoading: isLoadingBoardIds,
    } = useDataFetch<number[]>({
        url: `/board_item/${itemType}/${itemId}/board/`,
        params: {
            environment_id: environment.id,
        },
        fetchOnMount: false,
    });

    // Controls on/off of the board picker popover
    const [showSelectBoardPopover, setShowSelectBoardPopover] = useState(false);
    useEffect(() => {
        // If we are showing the board picker popover,
        // we have to show which board has the item
        if (showSelectBoardPopover) {
            fetchBoardIds();
        }
    }, [showSelectBoardPopover]);

    // Controls on/off of the board creation popover
    const [showCreateModal, setShowCreateModal] = useState(false);

    const dispatch: Dispatch = useDispatch();

    // Either show modal and hide popover or vice versa
    const flipShowModalAndPopover = React.useCallback((showModal: boolean) => {
        setShowCreateModal(showModal);
        setShowSelectBoardPopover(!showModal);
    }, []);

    // Add or remove the user item to board
    const handleAddOrRemoveBoardItem = React.useCallback(
        async (boardId: number, boardName: string = 'Untitled') => {
            if (!(boardIds || []).includes(boardId)) {
                // Add item
                await dispatch(addBoardItem(boardId, itemType, itemId));
                toast.success(`Item added to the list "${boardName}"!`);
            } else {
                // remove item
                await dispatch(deleteBoardItem(boardId, itemType, itemId));
                toast.success(`Item removed from the list "${boardName}"!`);
            }
            setShowSelectBoardPopover(false);
        },
        [itemType, itemId, boardIds]
    );

    const handleAfterBoardCreation = React.useCallback(
        async (rawBoard: IBoardRaw) => {
            await handleAddOrRemoveBoardItem(rawBoard.id, rawBoard.name);
            setShowCreateModal(false);
            setShowSelectBoardPopover(false); // just in case
        },
        [handleAddOrRemoveBoardItem]
    );

    // Rendering ----------------------------------------------
    const boardPickerPopover = showSelectBoardPopover ? (
        <Popover
            onHide={() => setShowSelectBoardPopover(false)}
            anchor={selfRef.current}
            layout={popoverLayout}
        >
            <div className="BoardItemAddButton-popover">
                {isLoadingBoardIds ? (
                    <Loading />
                ) : (
                    <BoardList
                        onBoardClick={(board) =>
                            handleAddOrRemoveBoardItem(board.id, board.name)
                        }
                        selectedBoardIds={boardIds || []}
                        onCreateBoardClick={() => flipShowModalAndPopover(true)}
                    />
                )}
            </div>
        </Popover>
    ) : null;

    return (
        <>
            <IconButton
                fill={true}
                ref={selfRef}
                icon="briefcase"
                tooltip={tooltip}
                tooltipPos="right"
                onClick={() => {
                    setShowSelectBoardPopover(true);
                }}
                {...IIconButtonProps}
            />
            {boardPickerPopover}
            {showCreateModal ? (
                <BoardCreateUpdateModal
                    onComplete={handleAfterBoardCreation}
                    onHide={() => flipShowModalAndPopover(false)}
                />
            ) : null}
        </>
    );
};
