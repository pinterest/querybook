import React, { useCallback, useEffect, useState } from 'react';

import { SamplingInfoButton } from 'components/QueryRunButton/QueryRunButton';
import PublicConfig from 'config/querybook_public_config.yaml';
import { QueryExecutionStatus } from 'const/queryExecution';
import { useInterval } from 'hooks/useInterval';
import { SoftButton } from 'ui/Button/Button';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { IListMenuItem, ListMenu } from 'ui/Menu/ListMenu';
import { AccentText } from 'ui/StyledText/StyledText';

import './SamplingToolTip.scss';

interface SamplingTooltipProps {
    queryExecutionStatus: QueryExecutionStatus;
    onSamplingInfoClick?: () => void;
    hasSamplingTables?: boolean;
    cancelQueryExecution: () => any;
    onRunClick: (sampleRate: number) => any;
}

export const SamplingTooltip: React.FC<SamplingTooltipProps> = ({
    queryExecutionStatus,
    onSamplingInfoClick,
    hasSamplingTables,
    cancelQueryExecution,
    onRunClick,
}) => {
    const [queryExecutionTime, setQueryExecutionTime] = useState(0);

    const queryIsRunning =
        QueryExecutionStatus.INITIALIZED <= queryExecutionStatus &&
        queryExecutionStatus <= QueryExecutionStatus.RUNNING;

    const TABLE_SAMPLING_CONFIG = PublicConfig.table_sampling ?? {
        enabled: false,
        sample_rates: [],
        default_sample_rate: 0,
    };

    const queryCanBeSampled =
        PublicConfig.table_sampling.enabled &&
        hasSamplingTables &&
        TABLE_SAMPLING_CONFIG.sample_rates.length > 0;

    const cancelAndRunQueryAsSampled = useCallback(
        (sampleRate) => {
            if (queryExecutionStatus === QueryExecutionStatus.RUNNING) {
                cancelQueryExecution();
            }
            onRunClick(sampleRate);
        },
        [cancelQueryExecution, onRunClick, queryExecutionStatus]
    );

    const sampleRateOptions: IListMenuItem[] =
        TABLE_SAMPLING_CONFIG.sample_rates.map(
            (value): IListMenuItem => ({
                name: value + '%',
                onClick: () => cancelAndRunQueryAsSampled(value),
                icon: 'Play',
            })
        );

    const samplingRunButtonDom = (
        <Dropdown
            className={'SamplingToolTip-button'}
            customButtonRenderer={() => (
                <SoftButton
                    title="Rerun with sampling"
                    color="light"
                    pushable={false}
                    icon={'ChevronDown'}
                />
            )}
        >
            <ListMenu items={sampleRateOptions} soft />
        </Dropdown>
    );

    useInterval(
        () => {
            setQueryExecutionTime((prevTime) => prevTime + 1);
        },
        1000,
        !(queryIsRunning && queryCanBeSampled)
    );

    useEffect(() => {
        if (!queryIsRunning) {
            setQueryExecutionTime(0);
        }
    }, [queryIsRunning]);

    const samplingToolTipDOM = (
        <div className="SamplingToolTip">
            <AccentText size="text" color="text">
                Hint: Query is running too slow? Try to use table sampling
            </AccentText>
            <SamplingInfoButton
                tooltipPos={'up'}
                onSamplingInfoClick={onSamplingInfoClick}
                size={16}
            />
            {samplingRunButtonDom}
        </div>
    );

    // If query run longer than 10 seconds, we show a suggestion to users they can sample their query
    return queryExecutionTime > 10 && samplingToolTipDOM;
};
