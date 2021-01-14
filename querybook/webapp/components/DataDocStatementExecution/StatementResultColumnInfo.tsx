import React, { useMemo } from 'react';
import styled from 'styled-components';
import { columnStatsAnalyzers } from 'lib/query-result/analyzer';
import { Title } from 'ui/Title/Title';
import { IColumnTransformer } from 'lib/query-result/types';
import { getTransformersForType } from 'lib/query-result/transformer';
import { Checkbox } from 'ui/Checkbox/Checkbox';

const StyledColumnInfo = styled.div.attrs({
    className: 'StatementResultColumnInfo',
})`
    width: 160px;
    font-size: var(--xsmall-text-size);

    .preview-warning {
        word-break: break-word;
        font-weight: var(--bold-font);
        .preview-warning-warning {
            color: var(--color-false-dark);
        }
    }

    .result-statistic {
        word-break: break-all;
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
        const statisticsAnalyzers = columnStatsAnalyzers.filter((analyzer) =>
            analyzer.appliesToType.includes(colType)
        );
        return statisticsAnalyzers.map((analyzer) => [
            analyzer.key,
            analyzer.name,
            analyzer.generator(columnValues),
        ]);
    }, [colType, columnValues]);

    const transformerPicker = columnTransformers.length ? (
        <div className="column-info-section mt8">
            <div className="column-info-header">
                <Title weight="var(--extra-bold-font)" size={8}>
                    TRANSFORMER
                </Title>
            </div>
            {columnTransformers.map((colTrans) => (
                <Checkbox
                    className="mb2"
                    key={colTrans.key}
                    title={colTrans.name}
                    value={transformer?.key === colTrans.key}
                    onChange={() =>
                        setTransformer(
                            transformer?.key !== colTrans.key ? colTrans : null
                        )
                    }
                />
            ))}
        </div>
    ) : null;

    const generateStatisticsDOM = () => {
        const statsDOM = statistics.map(([key, name, stat]) => (
            <div key={key} className="result-statistic">
                {name}: {stat}
            </div>
        ));
        return <div>{statsDOM}</div>;
    };

    const quickInsightsDOM = statistics.length ? (
        <div className="column-info-section mt8">
            <div className="column-info-header">
                <Title weight="var(--extra-bold-font)" size={8}>
                    QUICK INSIGHTS
                </Title>
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
                    <Title weight="var(--extra-bold-font)" size={8}>
                        OVERVIEW
                    </Title>
                </div>
                <div className="column-dropdown-content">Type: {colType}</div>
            </div>
            {transformerPicker}
            {quickInsightsDOM}
        </StyledColumnInfo>
    );
};
