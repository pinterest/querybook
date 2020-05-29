import * as React from 'react';

import './Tip.scss';
import { Icon } from 'ui/Icon/Icon';

const tips: string[] = require('config/loading_hints.yaml').hints;

export const Tip: React.FunctionComponent = () => {
    return (
        <div className="Tip">
            {tips.map((tip, idx) => (
                <div className="Tip-item flex-row mb12" key={idx}>
                    <Icon name="zap" />
                    {tip}
                </div>
            ))}
        </div>
    );
};
