import React from 'react';
import { UserBadge } from 'components/UserBadge/UserBadge';
import { Link } from 'react-router-dom';

import { IDataDocPreview } from 'redux/search/types';
import { generateFormattedDate } from 'lib/utils/datetime';

import { Title } from 'ui/Title/Title';

interface IProps {
    data: IDataDocPreview;
}

export const DataDocTableItem: React.FunctionComponent<IProps> = (
    { data: dataDoc },
    key
) => {
    const dataDocDOM = {
        title: (
            <span>
                <i className="fas fa-file-alt" />
                &nbsp;
                <Title size={6}>{dataDoc.title}</Title>
            </span>
        ),
        owner: <UserBadge uid={dataDoc.owner_uid} />,
        createdAt: generateFormattedDate(dataDoc.created_at, 'X'),
    };

    const columns = ['title', 'owner', 'createdAt'];
    const columnsDOM = columns.map((column, index) => (
        <td key={index} className={`data-doc-table-${column}`}>
            <Link to={`/datadoc/${dataDoc.id}/`}>{dataDocDOM[column]}</Link>
        </td>
    ));

    return (
        <tr className="DataDocTableItem" key={key}>
            {columnsDOM}
        </tr>
    );
};
