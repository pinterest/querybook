import 'chartjs-adapter-moment';
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';

import { UserName } from 'components/UserBadge/UserName';
import { ImpressionType } from 'const/impression';
import { useResource } from 'hooks/useResource';
import { generateFormattedDate } from 'lib/utils/datetime';
import { ImpressionResource } from 'resource/impression';
import { Loading } from 'ui/Loading/Loading';
import { Table } from 'ui/Table/Table';
import { Tabs } from 'ui/Tabs/Tabs';

import './ImpressionWidgetMenu.scss';

interface IProps {
    type: ImpressionType;
    itemId: number;
}

export const ImpressionWidgetMenu: React.FunctionComponent<IProps> = (
    props
) => {
    const [menuTab, setMenuTab] = useState('users');
    const contentDOM =
        menuTab === 'users' ? (
            <ImpressionWidgetUsers {...props} />
        ) : (
            <ImpressionWidgetTimeseries {...props} />
        );
    return (
        <div className="ImpressionWidgetMenu flex-column p8">
            <Tabs
                selectedTabKey={menuTab}
                items={[
                    { key: 'users', name: 'Top Users' },
                    { key: 'timeseries', name: 'Views Over Time' },
                ]}
                onSelect={setMenuTab}
                pills
                className="mb16"
            />
            {contentDOM}
        </div>
    );
};

const ImpressionWidgetUsers: React.FC<IProps> = ({ type, itemId }) => {
    const { data: users, isLoading } = useResource(
        React.useCallback(
            () => ImpressionResource.getUsers(type, itemId),
            [type, itemId]
        )
    );

    if (isLoading) {
        return <Loading />;
    }

    const tableDOM = (
        <Table
            cols={[
                {
                    accessor: 'uid',
                    Header: 'Name',
                },
                { accessor: 'views_count', Header: 'Number of Views' },
                { accessor: 'latest_view_at', Header: 'Last Viewed On' },
            ]}
            showAllRows
            rows={users}
            formatCell={(index, column, row) => {
                let dom = row[column];
                if (column === 'uid') {
                    dom = <UserName uid={dom} />;
                } else if (column === 'latest_view_at') {
                    dom = <span>{generateFormattedDate(dom)}</span>;
                }
                return (
                    <div
                        key={`${row.uid}-${column}`}
                        className={`col-${column} flex-row center-align`}
                    >
                        {dom}
                    </div>
                );
            }}
        />
    );

    return <div className="ImpressionWidgetUsers">{tableDOM}</div>;
};

const ImpressionWidgetTimeseries: React.FC<IProps> = ({ type, itemId }) => {
    const { data: viewsDates, isLoading } = useResource(
        React.useCallback(
            () => ImpressionResource.getTimeSeries(type, itemId),
            [type, itemId]
        )
    );

    if (isLoading) {
        return <Loading />;
    }

    const chartDOM = (
        <Line
            data={{
                datasets: [
                    {
                        label: 'Number of Views',
                        data: viewsDates.map((numViewDate) => numViewDate[0]),
                        lineTension: 0,
                    },
                ],
                labels: viewsDates.map(
                    (numViewDate) => new Date(numViewDate[1] * 1000)
                ),
            }}
            options={{
                elements: {
                    point: {
                        radius: 3,
                        hitRadius: 3,
                        hoverRadius: 3,
                        hoverBorderWidth: 5,
                    },
                },
                scales: {
                    x: {
                        type: 'time',

                        time: {
                            unit: 'week',
                            displayFormats: {
                                week: 'l',
                            },
                        },
                    },
                    y: {
                        beginAtZero: 0,
                    },
                },
            }}
        />
    );

    return <div className="ImpressionWidgetTimeseries">{chartDOM}</div>;
};
