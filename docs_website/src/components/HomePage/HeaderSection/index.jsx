import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';
import './index.scss';

export default () => {
    return (
        <div className="HeaderSection HomePageSection">
            <div className="hero ">
                <div className="container">
                    <h1 className="hero__title">
                        Discover, Analyze, and Collaborate
                    </h1>
                    <p className="hero__subtitle">
                        DataHub is Pinterest’s open-sourced big data portal via
                        a notebook interface.
                    </p>
                    <div className="DataHubTutorialVideo">
                        <iframe
                            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                    <div className="HeaderActions flex-center">
                        <Link
                            className="button button--primary button--lg"
                            to="/tryout"
                        >
                            Request Demo
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
