import React from 'react';
import Heading from '../../Heading';
import Grid from '../../Grid';

import './index.scss';

const userReviews = [
    {
        name: 'Alice, Engineer @Pinterest',
        comment:
            'Love the UI! Especially like the separation of adhoc queries and saved datadocs!',
    },
    {
        name: 'Bob, PM @Pinterest',
        comment:
            "Datahub is amazing! I can't imagine doing my work without DataHub",
    },
    {
        name: 'Cindy, SRE @CompanyC',
        comment: 'So simple to set up and make it work!',
    },
];

export default () => {
    return (
        <div className="container UsersSection HomePageSection">
            <Heading
                headingKey="Feedback"
                title="Here’s what users are saying about DataHub"
            />
            <Grid
                itemPerRow={3}
                items={userReviews}
                renderer={(item) => (
                    <div className="UserReview">
                        <p className="UserReview-comment">
                            <q>{item.comment}</q>
                        </p>
                        <p className="UserReview-name">{item.name}</p>
                    </div>
                )}
            />
        </div>
    );
};
