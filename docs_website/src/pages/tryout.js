import Layout from '@theme/Layout';
import React from 'react';
import TryItOut from '../components/TryItOut';

import './tryout.scss';

export default () => {
    return (
        <Layout>
            <div className="TryOutPage">
                <TryItOut />
            </div>
        </Layout>
    );
};
