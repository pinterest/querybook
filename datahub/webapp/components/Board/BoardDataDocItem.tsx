import * as React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { IStoreState } from 'redux/store/types';
import { getWithinEnvUrl } from 'lib/utils/query-string';

import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';
import { Icon } from 'ui/Icon/Icon';
import { Title } from 'ui/Title/Title';

interface IProps {
    docId: number;
}

export const BoardDataDocItem: React.FunctionComponent<IProps> = ({
    docId,
}) => {
    const doc = useSelector(
        (state: IStoreState) => state.dataDoc.dataDocById[docId]
    );

    return (
        <div className="BoardDataDocItem BoardItem mv24 p12">
            <div className="BoardDataDocItem-top horizontal-space-between">
                <div className="flex-row">
                    <Link
                        to={{
                            pathname: getWithinEnvUrl(`/datadoc/${doc.id}/`),
                        }}
                        className="BoardItem-title"
                    >
                        <Title size={4}>{doc.title}</Title>
                    </Link>
                    <BoardItemAddButton
                        size={16}
                        itemType="data_doc"
                        itemId={docId}
                    />
                </div>
                <Icon name="file" className="mh8" />
            </div>
        </div>
    );
};
