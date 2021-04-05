import React from 'react';
import Link from '@docusaurus/Link';
import Heading from '../../Heading';
import Grid from '../../Grid';
import { Databases, CloudPlatforms } from './content';
import './index.scss';

export default () => {
    return (
        <div className="container IntegrationsSection HomePageSection">
            <Heading
                headingKey="Integrations"
                title="Out-of-the-box support"
                subtitle="With the help of plugins, additional integrations can be added easily."
            />
            <div className="integrations-grid">
                <p className="integrations-title">
                    The following Databases are supported
                </p>
                <Grid
                    items={Databases}
                    itemPerRow={4}
                    renderer={(item) => (
                        <div className="logo-container">
                            <img
                                src={`img/${item.image}`}
                                height={'80px'}
                                alt={item.key}
                            />
                        </div>
                    )}
                    itemClassName={'logo-item'}
                />
                <br />
                <p className="flex-center">
                    View the full list of supported databases&nbsp;
                    <Link to="/docs/setup_guide/connect_to_query_engines">
                        here
                    </Link>
                    .
                </p>
            </div>
            <div className="integrations-grid">
                <p className="integrations-title">
                    Querybook also supports the following Cloud Platforms
                </p>
                <Grid
                    items={CloudPlatforms}
                    itemPerRow={4}
                    renderer={(item) => (
                        <div className="logo-container">
                            <img
                                src={`img/${item.image}`}
                                height={'80px'}
                                alt={item.key}
                            />
                        </div>
                    )}
                    itemClassName={'logo-item'}
                />
            </div>
        </div>
    );
};
