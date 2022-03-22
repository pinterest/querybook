import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { Dispatch, IStoreState } from 'redux/store/types';
import { getWithinEnvUrl } from 'lib/utils/query-string';

import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';
import { Icon } from 'ui/Icon/Icon';
import { Title } from 'ui/Title/Title';
import { fetchDataDocIfNeeded } from 'redux/dataDoc/action';

interface IProps {
    docId: number;
}

export const BoardDataDocItem: React.FunctionComponent<IProps> = ({
    docId,
}) => {
    const doc = useSelector(
        (state: IStoreState) => state.dataDoc.dataDocById[docId]
    );

    const dispatch: Dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(fetchDataDocIfNeeded(docId));
    }, [docId]);

    return (
        <div className="BoardDataDocItem BoardItem mv24 p12">
            <div className="BoardDataDocItem-top horizontal-space-between">
                <div className="flex-row">
                    <Link
                        to={getWithinEnvUrl(`/datadoc/${doc.id}/`)}
                        className="BoardItem-title"
                    >
                        <Title size="med">{doc.title}</Title>
                    </Link>
                    <BoardItemAddButton
                        size={16}
                        itemType="data_doc"
                        itemId={docId}
                    />
                </div>
                <Icon name="File" className="BoardItemIcon mh8" />
            </div>
        </div>
    );
};
