import React from 'react';
import { useSelector } from 'react-redux';

import { EmptyText } from 'ui/StyledText/StyledText';
import { Modal } from 'ui/Modal/Modal';
import { BoardDetailedList } from 'components/BoardDetailedList/BoardDetailedList';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { Loading } from 'ui/Loading/Loading';
import { BoardResource } from 'resource/board';
import { IDataDoc } from 'const/datadoc';
import { useResource } from 'hooks/useResource';

interface IProps {
    dataDoc: IDataDoc;
    onHide: () => void;
}

export const DataDocBoardsModal: React.FunctionComponent<IProps> = ({
    dataDoc,
    onHide,
}) => {
    const environment = useSelector(currentEnvironmentSelector);

    const { data: boards, isLoading } = useResource(
        React.useCallback(
            () =>
                BoardResource.getItemBoards(
                    environment.id,
                    'data_doc',
                    dataDoc.id
                ),
            [environment.id, dataDoc.id]
        )
    );

    const dataDocName = dataDoc.title ? `"${dataDoc.title}"` : 'the DataDoc';

    const noBoardsDOM = (
        <EmptyText className="m24">No lists available.</EmptyText>
    );

    return (
        <Modal onHide={onHide} title={`Lists Containing ${dataDocName}`}>
            {isLoading ? (
                <Loading />
            ) : boards.length ? (
                <BoardDetailedList boards={boards} />
            ) : (
                noBoardsDOM
            )}
        </Modal>
    );
};
