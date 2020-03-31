import React, { useState } from 'react';
import { useSelector } from 'react-redux';
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
            cols={['Name', 'Number of Views', 'Last Viewed On']}
            showAllRows
            rows={users}
            formatCell={(columnNum, column, row) => {
                let dom = null;
                if (columnNum === 0) {
                    dom = <UserBadge uid={row.uid} mini />;
                } else if (columnNum === 1) {
                    dom = row.views_count;
                } else if (columnNum === 2) {
                    dom = (
                        <span>{generateFormattedDate(row.latest_view_at)}</span>
                    );
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
