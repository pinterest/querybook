import React from 'react';

import Grid from '../../Grid';
import Heading from '../../Heading';
import './index.scss';

const userReviews = [
    {
        name: 'Arvin Rezvanpour, SWE @Pinterest',
        comment:
            'Querybook has been instrumental to the Advertiser Growth Team at Pinterest. It allows us to opportunity size new experiment ideas and do offline experiment analysis in a collaborative and scalable way.',
    },
    {
        name: 'Jesse Lumarie, SWE @Pinterest',
        comment:
            "I rely on Querybook every day to query, organize and analyze Pinterest data.  It's a fast and intuitive program that gets out of the way and allows me to focus on identifying trends and opportunities.",
    },
    {
        name: 'OJ Bright, Quantitative Researcher @GrandRounds',
        comment:
            'I know I am so incredibly late to the party, but I made my first DataDoc yesterday and I think I’m in love…',
    },
];

export default () => {
    return (
        <div className="container UsersSection HomePageSection">
            <Heading
                headingKey="Feedback"
                title="Here’s what users are saying about Querybook"
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
