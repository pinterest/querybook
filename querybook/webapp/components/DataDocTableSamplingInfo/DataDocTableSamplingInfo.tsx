import { debounce } from 'lodash';
import React, { useEffect, useState } from 'react';

import { transformTableSamplingQuery } from 'components/QueryComposer/RunQuery';
import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import PublicConfig from 'config/querybook_public_config.yaml';
import { ISamplingTables } from 'const/datadoc';
import { formatError } from 'lib/utils/error';
import { Link } from 'ui/Link/Link';
import { Loading } from 'ui/Loading/Loading';
import { ErrorMessage } from 'ui/Message/ErrorMessage';

interface IProps {
    query: string;
    language: string;
    samplingTables: ISamplingTables;
    sampleRate: number;
}

export const DataDocTableSamplingInfo: React.FC<IProps> = ({
    query,
    language,
    samplingTables,
    sampleRate,
}) => {
    const [sampledQuery, setSampledQuery] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const SAMPLE_USER_GUIDE_LINK =
        PublicConfig.table_sampling?.sample_user_guide_link ?? '';

    useEffect(() => {
        const fetchData = debounce(async () => {
            try {
                const sampledQuery = await transformTableSamplingQuery(
                    query,
                    language,
                    samplingTables,
                    sampleRate
                );
                setSampledQuery(sampledQuery);
            } catch (error) {
                setError(error);
            } finally {
                setIsLoading(false);
            }
        }, 500);

        setIsLoading(true);
        fetchData();

        return () => {
            fetchData.cancel();
        };
    }, [query, language, sampleRate, samplingTables]);

    if (isLoading) {
        return <Loading />;
    } else if (error) {
        return (
            <ErrorMessage title={'Failed to sample query'}>
                {formatError(error)}
            </ErrorMessage>
        );
    } else {
        return (
            <div className="">
                By enabling table sampling, it will use a sample version of the
                table or apply table sample to the original table. Please see
                more about it
                <Link to={SAMPLE_USER_GUIDE_LINK}> here</Link>
                <QueryComparison
                    fromQuery={query}
                    toQuery={sampledQuery ?? ''}
                    fromQueryTitle={'Original Query'}
                    toQueryTitle={'Transformed Query'}
                />
            </div>
        );
    }
};
