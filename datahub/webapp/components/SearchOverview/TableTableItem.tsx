import React from 'react';
import { UserBadge } from 'components/UserBadge/UserBadge';
import { Link } from 'react-router-dom';
import { ITablePreview } from 'redux/search/types';

import { generateFormattedDate } from 'lib/utils/datetime';
import { Title } from 'ui/Title/Title';

interface IProps {
    data: ITablePreview;
}

export const TableTableItem: React.FunctionComponent<IProps> = (
    { data: table },
    key
) => {
    const tableDOM = {
        schema: <Title size={6}>{table.schema}</Title>,
        name: <Title size={6}>{table.name}</Title>,
    };

    const columns = ['schema', 'name'];
    const columnsDOM = columns.map((column, index) => (
        <td key={index} className={`table-table-${column}`}>
            <Link to={`/table/${table.id}/`}>{tableDOM[column]}</Link>
        </td>
    ));

    return (
        <tr className="TableTableItem" key={key}>
            {columnsDOM}
        </tr>
    );
};
