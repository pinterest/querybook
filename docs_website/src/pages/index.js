import Layout from '@theme/Layout';
import React from 'react';

import HeaderSection from '../components/HomePage/HeaderSection';
import FeatureSection from '../components/HomePage/FeatureSection';
import IntegrationsSection from '../components/HomePage/IntegrationsSection';
import DeploymentSection from '../components/HomePage/DeploymentSection';
import UsersSection from '../components/HomePage/UsersSection';
import AnnouncementSection from '../components/HomePage/AnnouncementSection';
import TryItOut from '../components/TryItOut';
import './index.scss';
import useWindowScroll from '../hooks/useWindowScroll';

export default () => {
    const scrolled = useWindowScroll() > 0;
    React.useEffect(() => {
        const scrollClassName = 'no-nav-border';
        if (scrolled) {
            document.body.classList.remove(scrollClassName);
        } else {
            document.body.classList.add(scrollClassName);
        }
        return () => {
            document.body.classList.remove(scrollClassName);
        };
    }, [scrolled]);

    return (
        <Layout>
            <AnnouncementSection />
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
