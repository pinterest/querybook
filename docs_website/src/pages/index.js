import Layout from '@theme/Layout';
import React from 'react';

import HeaderSection from '../components/HomePage/HeaderSection';
import FeatureSection from '../components/HomePage/FeatureSection';
import IntegrationsSection from '../components/HomePage/IntegrationsSection';
import DeploymentSection from '../components/HomePage/DeploymentSection';
import UsersSection from '../components/HomePage/UsersSection';
import TryItOut from '../components/TryItOut';
import './index.scss';

export default () => {
    return (
        <Layout>
            <HeaderSection />
            <FeatureSection featureType="key" />
            <FeatureSection featureType="plugin" />
            <IntegrationsSection />
            <DeploymentSection />
            <UsersSection />
            <div className="HomePageSection">
                <TryItOut />
            </div>
        </Layout>
    );
};
