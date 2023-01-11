import { sample } from 'lodash';
import React from 'react';

import loadingHintsConfig from 'config/loading_hints.yaml';
import { Icon } from 'ui/Icon/Icon';
import { LoadingIcon } from 'ui/Loading/Loading';
import { Subtitle, Title } from 'ui/Title/Title';

const loadingHints = loadingHintsConfig.hints;

export const DataDocLoading: React.FC = () => {
    const hint = sample(loadingHints);

    return (
        <div className="datadoc-loading flex-center">
            <div className="flex-column">
                <LoadingIcon className="mb16" />
                <Title color="light">Loading DataDoc</Title>
                <Icon name="Zap" className="mt16 mb8" color="accent" />
                <Subtitle>Did you know?</Subtitle>
                <div className="mt8">{hint}</div>
            </div>
        </div>
    );
};
