import React, { useMemo } from 'react';
import styled from 'styled-components';
import {
    findColumnType,
    columnStatsPresenters,
} from 'lib/query-result/analyzer';
import { Title } from 'ui/Title/Title';

const StyledColumnInfo = styled.div.attrs({
    className: 'StatementResultColumnInfo',
})`
    font-size: var(--xsmall-text-size);
`;

export const StatementResultColumnInfo: React.FC<{
    rows: any[][];
    colIndex: number;
    colName: string;
}> = ({ rows, colIndex, colName }) => {
    const columnValues = useMemo(() => rows.map((row) => row[colIndex]), [
        rows,
        colIndex,
    ]);
    const columnType = useMemo(() => findColumnType(colName, columnValues), [
        colName,
        columnValues,
    ]);

    const statistics = useMemo(() => {
        const statisticsPresenters = columnStatsPresenters.filter((presenter) =>
            presenter.appliesToType.includes(columnType)
        );
        return statisticsPresenters.map((presenter) => [
            presenter.key,
            presenter.name,
            presenter.generator(columnValues),
        ]);
    }, [columnType, columnValues]);

    const generateStatisticsDOM = () => {
        const statsDOM = statistics.map(([key, name, stat]) => {
            return (
                <div key={key}>
                    {name}: {stat}
                </div>
            );
        });
        return <div>{statsDOM}</div>;
    };

    return (
        <StyledColumnInfo className={' p8'}>
            <div className="column-dropdown-section">
                <div className="column-dropdown-header">
                    <Title size={8}>OVERVIEW</Title>
                </div>
                <div className="column-dropdown-content">
                    Type: {columnType}
                </div>
            </div>
            <div className="column-dropdown-section mt4">
                <div className="column-dropdown-header">
                    <Title size={8}>QUICK INSIGHTS</Title>
                </div>
                <div className="column-dropdown-content">
                    {generateStatisticsDOM()}
                </div>
            </div>
        </StyledColumnInfo>
    );
};
