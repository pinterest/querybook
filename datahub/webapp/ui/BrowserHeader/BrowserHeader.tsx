import React from 'react';

import { Title } from 'ui/Title/Title';

export interface IBrowserHeaderProps {
    title: string | JSX.Element;
    description: string | JSX.Element;
}

export const BrowserHeader: React.FunctionComponent<IBrowserHeaderProps> = ({
    title,
    description,
    children,
}) => {
    const rightColumnDOM = children && (
        <div className="column is-narrow">{children}</div>
    );

    return (
        <div className="BrowserHeader">
            <div className="hero header-hero">
                <div className="hero-body">
                    <div>
                        <div className="columns">
                            <div className="column">
                                <Title className="is-spaced">{title}</Title>
                                <Title subtitle>{description}</Title>
                            </div>
                            {rightColumnDOM}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
