import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';

import { IStoreState } from 'redux/store/types';
import { ImpressionType } from 'const/impression';
import { useDataFetch } from 'hooks/useDataFetch';
import { Tabs } from 'ui/Tabs/Tabs';
import { Loading } from 'ui/Loading/Loading';
import { generateFormattedDate } from 'lib/utils/datetime';
import { UserBadge } from 'components/UserBadge/UserBadge';
import { Table } from 'ui/Table/Table';
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
        <div className="ImpressionWidgetMenu flex-column">
            <Tabs
                selectedTabKey={menuTab}
                items={[
                    { key: 'users', name: 'Top Users' },
                    { key: 'timeseries', name: 'Views Over Time' },
                ]}
                onSelect={setMenuTab}
            />
            {contentDOM}
        </div>
    );
};

const ImpressionWidgetUsers: React.FC<IProps> = ({ type, itemId }) => {
    const { data: users, isLoading } = useDataFetch<
        Array<{
            latest_view_at: number;
            uid: number;
            views_count: number;
        }>
    >({
        url: `/impression/${type}/${itemId}/users/`,
    });

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
                    dom = <UserBadge uid={dom} mini />;
                } else if (column === 'latest_view_at') {
                    dom = <span>{generateFormattedDate(dom)}</span>;
                }
                return (
                    <div
                        key={`${row.uid}-${column}`}
                        className={`col-${column} flex-row`}
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
    const { data: viewsDates, isLoading } = useDataFetch<
        Array<[number, number]>
    >({
        url: `/impression/${type}/${itemId}/timeseries/`,
    });

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
                    xAxes: [
                        {
                            type: 'time',

                            time: {
                                unit: 'week',
                                displayFormats: {
                                    week: 'll',
                                },
                            },
                        },
                    ],
                    yAxes: [
                        {
                            ticks: {
                                min: 0,
                            },
                        },
                    ],
                },
            }}
        />
    );

    return <div className="ImpressionWidgetTimeseries">{chartDOM}</div>;
};
