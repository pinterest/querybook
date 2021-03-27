import React from 'react';
import Link from '@docusaurus/Link';
import Heading from '../Heading';
import './index.scss';

export default () => {
    return (
        <div className="TryItOut container">
            <Heading
                headingKey="Try it out"
                title="Interested?"
                subtitle="Use the following resources to get a demo instance running in a few minutes."
            />
            <div className=" cards-container">
                <div class="card">
                    <div class="card__header">
                        <h3>Step 1: Download</h3>
                    </div>
                    <div class="card__body">
                        <p>Visit Github to fork/clone the repo.</p>
                    </div>
                    <div class="card__footer">
                        <Link
                            class="button button--secondary button--block"
                            to={'https://github.com/pinterest/querybook'}
                        >
                            Github
                        </Link>
                    </div>
                </div>
                <div class="card">
                    <div class="card__header">
                        <h3>Step 2: Run</h3>
                    </div>
                    <div class="card__body">
                        <p>
                            Run <i>make</i> in the root directory to start the
                            demo instance.
                        </p>
                    </div>
                    <div class="card__footer">
                        <Link
                            class="button button--secondary button--block"
                            to="/docs/setup_guide/quick_setup"
                        >
                            Quick Start Guide
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
