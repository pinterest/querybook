import React from 'react';
import { sample } from 'lodash';
import { Title } from 'ui/Title/Title';

const loadingHints: string[] = require('config/loading_hints.yaml').hints;

export const DataDocLoading: React.FC = () => {
    const hint = sample(loadingHints);

    return (
        <div className="datadoc-loading">
            <div className="datadoc-loading-message">
                <Title className="flex-center">
                    <i className="fa fa-spinner fa-pulse mr8" />
                    Loading DataDoc
                </Title>

                <br />
                <p className="subtitle">
                    <i className="far fa-lightbulb mr8" />
                    Did you know: {hint}
                </p>
            </div>
        </div>
    );
};
