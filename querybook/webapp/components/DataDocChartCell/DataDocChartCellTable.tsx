import * as React from 'react';

import { StatementResultTable } from 'components/StatementResultTable/StatementResultTable';
import { Title } from 'ui/Title/Title';

import './DataDocChartCellTable.scss';

interface IProps {
    title: string;
    data: any[][];
}

export const DataDocChartCellTable: React.FunctionComponent<IProps> = ({
    title,
    data,
}) => (
    <div className="DataDocChartCellTable">
        {title?.length ? (
            <Title size="text" className="mv4 center-align">
                {title}
            </Title>
        ) : null}
        <StatementResultTable
            data={data}
            paginate={true}
            maxNumberOfRowsToShow={20}
        />
    </div>
);
