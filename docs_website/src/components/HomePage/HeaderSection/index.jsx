import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';
import GradientText from './GradientText';
import './index.scss';

export default () => {
    const { isDarkTheme } = useColorMode();
    return (
        <div className="HeaderSection HomePageSection">
            <div className="hero ">
                <div className="container">
                    <h1 className="hero__title">
                        <GradientText
                            text="Discover"
                            className="text-discover"
                        />
                        ,&nbsp;
                        <GradientText text="Analyze" className="text-analyze" />
                        , and&nbsp;
                        <GradientText
                            text="Collaborate"
                            className="text-collaborate"
                        />
                    </h1>
                    <p className="hero__subtitle">
                        <b>Querybook</b> is Pinterest’s open-source big data IDE
                        via a notebook interface.
                    </p>
                    <div className="HeaderActions flex-center">
                        <Link
                            className="button button--primary button--lg"
                            to="/docs/setup_guide/quick_setup"
                        >
                            Try out with 1 command
                        </Link>
                        <Link
                            className="button button--link button--lg"
                            to="https://join.slack.com/t/querybook/shared_invite/zt-se82lvld-yyzRIqvIASsyYozk7jMCYQ"
                        >
                            Join our Slack Community
                        </Link>
                        <span className="github-button">
                            <iframe
                                src="https://ghbtns.com/github-btn.html?user=pinterest&repo=querybook&type=star&count=true&size=large"
                                frameborder="0"
                                scrolling="0"
                                width="170"
                                height="30"
                                title="GitHub"
                            ></iframe>
                        </span>
                    </div>
                    <div className="Querybook-Showcase">
                        <img
                            src={useBaseUrl('img/homepage.png')}
                            className="mac-box-shadow"
                        />
                    </div>
                </div>
            </div>

            <div className="container">
                <div className="used-by text">
                    <p>Used by Engineers and Data Scientists from</p>
                </div>
                <div className="flex-center used-by-logos">
                    <Link to="https://www.pinterest.com">
                        <img
                            src={useBaseUrl('img/orgs/pinterest_logo.svg')}
                            className="used-by-logo"
                        />
                    </Link>
                    <Link to="https://grandrounds.com/">
                        <img
                            src={useBaseUrl(
                                isDarkTheme
                                    ? 'img/orgs/grand_rounds_health_dark.svg'
                                    : 'img/orgs/grand_rounds_health.png'
                            )}
                            className="used-by-logo"
                        />
                    </Link>
                    <Link to="https://razorpay.com/">
                        <img
                            src={useBaseUrl(
                                isDarkTheme
                                    ? 'img/orgs/razorpay_logo_dark.svg'
                                    : 'img/orgs/razorpay_logo.svg'
                            )}
                            className="used-by-logo"
                        />
                    </Link>
                </div>
            </div>
        </div>
    );
};
