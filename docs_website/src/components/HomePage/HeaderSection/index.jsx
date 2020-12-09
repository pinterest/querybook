import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';
import './index.scss';
import GradientText from './GradientText';

export default () => {
    return (
        <div className="HeaderSection HomePageSection">
            <div className="hero ">
                <div className="container">
                    <h1 className="hero__title">
                        <GradientText
                            text="Discover"
                            className="text-discover"
                        />
                        ,{' '}
                        <GradientText text="Analyze" className="text-analyze" />
                        , and{' '}
                        <GradientText
                            text="Collaborate"
                            className="text-collaborate"
                        />
                    </h1>
                    <p className="hero__subtitle">
                        <b>Querybook</b> is Pinterest’s open-sourced big data
                        IDE via a notebook interface.
                    </p>
                    <div className="Querybook-Showcase">
                        <img
                            src={useBaseUrl('img/homepage.png')}
                            className="mac-box-shadow"
                        />
                    </div>
                    <div className="HeaderActions flex-center">
                        <Link
                            className="button button--primary button--lg"
                            to="/waitlist"
                        >
                            Waitlist
                        </Link>
                        <Link
                            className="button button--secondary button--lg"
                            to="/docs"
                        >
                            Read the Docs
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container">
                <p className="used-by text">
                    Used by Engineers and Data Scientists From
                </p>
                <div className="flex-center used-by-logos">
                    <Link to="https://www.pinterest.com">
                        <img
                            src={useBaseUrl('img/orgs/pinterest_badge.png')}
                            height="50px"
                        />
                    </Link>
                    <Link to="https://grandrounds.com/">
                        <img
                            src={useBaseUrl('img/orgs/grandrounds_badge.png')}
                            height="50px"
                        />
                    </Link>
                </div>
            </div>
        </div>
    );
};
