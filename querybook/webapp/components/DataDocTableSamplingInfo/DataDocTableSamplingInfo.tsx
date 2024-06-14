import React from 'react';

import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import PublicConfig from 'config/querybook_public_config.yaml';
import { ISamplingTables } from 'const/datadoc';
import { useResource } from 'hooks/useResource';
import { formatError } from 'lib/utils/error';
import { QueryTransformResource } from 'resource/queryTransform';
import { Link } from 'ui/Link/Link';
import { Loading } from 'ui/Loading/Loading';
import { ErrorMessage } from 'ui/Message/ErrorMessage';
import { Modal } from 'ui/Modal/Modal';

import './DataDocTableSamplingInfo.scss';

interface IProps {
    query: string;
    language: string;
    samplingTables: ISamplingTables;
    onHide: () => void;
}

export const DataDocTableSamplingInfo: React.FC<IProps> = ({
    query,
    language,
    samplingTables,
    onHide,
}) => {
    const sampleUserGuideLink =
        PublicConfig.table_sampling?.sample_user_guide_link ?? '';

    const {
        data: sampledQuery,
        isLoading,
        isError,
        error,
    } = useResource(
        React.useCallback(
            () =>
                QueryTransformResource.getSampledQuery(
                    query,
                    language,
                    samplingTables
                ),
            [language, query, samplingTables]
        )
    );

    let contentDOM = null;

    if (isLoading) {
        contentDOM = <Loading />;
    } else if (isError) {
        contentDOM = (
            <ErrorMessage title={'Failed to sample query.'}>
                {formatError(error)}
            </ErrorMessage>
        );
    } else {
        contentDOM = (
            <Modal onHide={onHide}>
                <div className="DataDocTableSamplingInfo">
                    By enabling table sampling, it will use a sample version of
                    the table or apply table sample to the original table.
                    {sampleUserGuideLink ? (
                        <span>
                            {' '}
                            Please see more about it{' '}
                            <Link to={sampleUserGuideLink} newTab>
                                <span className="link-text-highlight">
                                    here
                                </span>
                            </Link>
                        </span>
                    ) : null}
                </div>
                <QueryComparison
                    fromQuery={query}
                    toQuery={sampledQuery}
                    fromQueryTitle={'Original Query'}
                    toQueryTitle={'Transformed Query'}
                />
            </Modal>
        );
    }
    return contentDOM;
};
