import React, { useEffect, useState } from 'react';

import { SamplingInfoButton } from 'components/QueryRunButton/QueryRunButton';
import PublicConfig from 'config/querybook_public_config.yaml';
import { IQueryExecution, QueryExecutionStatus } from 'const/queryExecution';
import { Message } from 'ui/Message/Message';
import { AccentText } from 'ui/StyledText/StyledText';

import './SamplingToolTip.scss';

interface SamplingTooltipProps {
    queryExecution: IQueryExecution;
    onSamplingInfoClick?: () => void;
    hasSamplingTables?: boolean;
    sampleRate: number;
}

export const SamplingTooltip: React.FC<SamplingTooltipProps> = ({
    queryExecution: { status, id },
    onSamplingInfoClick,
    hasSamplingTables,
    sampleRate,
}) => {
    const { enabled, sampling_tool_tip_delay: delay } =
        PublicConfig.table_sampling;

    const [showSamplingTip, setShowSamplingTip] = useState(false);

    // If query run longer than 10 seconds, we show a suggestion to users they can sample their query
    useEffect(() => {
        if (
            enabled &&
            hasSamplingTables &&
            sampleRate <= 0 &&
            status === QueryExecutionStatus.RUNNING
        ) {
            const timer = setTimeout(() => {
                setShowSamplingTip(true);
            }, delay);

            return () => {
                clearTimeout(timer);
                setShowSamplingTip(false);
            };
        }
    }, [id, delay, enabled, hasSamplingTables, sampleRate, status]);

    const samplingTipDOM = showSamplingTip && (
        <Message size="small" type="warning" className="SamplingToolTip">
            <div className="flex-row">
                <AccentText size="text" color="text">
                    Hint: Query is running too slow? You can select table
                    sampling next to the run button right now and get a faster
                    result.
                </AccentText>
                <SamplingInfoButton
                    tooltipPos={'up'}
                    onSamplingInfoClick={onSamplingInfoClick}
                    size={16}
                />
            </div>
        </Message>
    );
    return samplingTipDOM;
};
