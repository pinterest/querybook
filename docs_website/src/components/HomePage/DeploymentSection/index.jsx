import React from 'react';
import Heading from '../../Heading';
import Grid from '../../Grid';
import Link from '@docusaurus/Link';

const deploymentInfos = [
    <p>
        Querybook is configured to work entirely inside Docker. With the help of
        docker-compose, you can start a{' '}
        <Link to="/docs/">full-featured demo</Link> instance within minutes.
    </p>,
    <p>
        When{' '}
        <Link to="/docs/setup_guide/deployment_guide">
            deploying to production
        </Link>
        , Querybook comes with an example K8s file for you to easily deploy to
        K8s cluster. You can also use docker-compose run to deploy each
        individual service to separate machines.
    </p>,
];

export default () => {
    return (
        <div className="container DeploymentSection HomePageSection">
            <Heading
                headingKey="Deployment"
                title="Setup & deploy in minutes."
            />
            <Grid
                itemPerRow={2}
                items={deploymentInfos}
                renderer={(item) => item}
            />
        </div>
    );
};
