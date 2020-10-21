import React, { useMemo } from 'react';
import styled from 'styled-components';
import { columnStatsPresenters } from 'lib/query-result/presenter';
import { Title } from 'ui/Title/Title';
import { IColumnTransformer } from 'lib/query-result/types';
import { getTransformersForType } from 'lib/query-result/transformer';
import { Checkbox } from 'ui/Form/Checkbox';

const StyledColumnInfo = styled.div.attrs({
    className: 'StatementResultColumnInfo',
})`
    font-size: var(--xsmall-text-size);

    .preview-warning {
        font-weight: var(--bold-font);
        .preview-warning-warning {
            color: var(--color-false-dark);
        }
    }
`;

export const StatementResultColumnInfo: React.FC<{
    rows: any[][];
    colIndex: number;
    colType: string;
    isPreview: boolean;

    transformer: IColumnTransformer;
    setTransformer: (transformer: IColumnTransformer) => any;
}> = ({ rows, colIndex, colType, isPreview, setTransformer, transformer }) => {
    const columnValues = useMemo(() => rows.map((row) => row[colIndex]), [
        rows,
        colIndex,
    ]);

    const columnTransformers = useMemo(
        () => getTransformersForType(colType)[0],
        [colType]
    );

    const statistics = useMemo(() => {
        const statisticsPresenters = columnStatsPresenters.filter((presenter) =>
            presenter.appliesToType.includes(colType)
        );
        return statisticsPresenters.map((presenter) => [
            presenter.key,
            presenter.name,
            presenter.generator(columnValues),
        ]);
    }, [colType, columnValues]);

    const transformerPicker = columnTransformers.length ? (
        <div className="column-info-section mt4">
            <div className="column-info-header">
                <Title size={8}>TRANSFORMER</Title>
            </div>
            {columnTransformers.map((coltrans) => (
                <Checkbox
                    className="mb2"
                    key={coltrans.key}
                    title={coltrans.name}
                    value={transformer?.key === coltrans.key}
                    onChange={(value) =>
                        setTransformer(value ? coltrans : null)
                    }
                />
            ))}
        </div>
    ) : null;

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

    const quickInsightsDOM = statistics.length ? (
        <div className="column-info-section mt4">
            <div className="column-info-header">
                <Title size={8}>QUICK INSIGHTS</Title>
            </div>
            <div className="column-dropdown-content">
                {generateStatisticsDOM()}
            </div>
        </div>
    ) : null;

    const incompleteDataWarning = isPreview ? (
        <div className="preview-warning mb4">
            <span className="preview-warning-warning">Warning:</span>
            Only analyzing the Preview and not the Full Result.
        </div>
    ) : null;

    return (
        <StyledColumnInfo className={' p8'}>
            <div className="column-info-section">
                {incompleteDataWarning}
                <div className="column-info-header">
                    <Title size={8}>OVERVIEW</Title>
                </div>
                <div className="column-dropdown-content">Type: {colType}</div>
            </div>
            {transformerPicker}
            {quickInsightsDOM}
        </StyledColumnInfo>
    );
};
