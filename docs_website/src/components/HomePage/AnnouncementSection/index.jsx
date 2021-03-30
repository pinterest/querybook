import * as ReactDOM from 'react-dom';
import React from 'react';
import Link from '@docusaurus/Link';
import './index.scss';

const ANNOUNCEMENT_DIV_ID = '__announcement_root';

const AnnouncementBanner = () => (
    <div className="AnnouncementSection">
        <p>
            🚀 March 30 2021 update: We just <b>open sourced Querybook</b> and
            published our first{' '}
            <b>
                <Link to="https://medium.com/@Pinterest_Engineering/open-sourcing-querybook-pinterests-collaborative-big-data-hub-ba2605558883">
                    blog post
                </Link>
            </b>{' '}
            🚀
        </p>
    </div>
);

export default () => {
    const [announcementRoot, setAnnouncementRoot] = React.useState(null);

    React.useEffect(() => {
        let rootDiv = document.getElementById(ANNOUNCEMENT_DIV_ID);
        if (!rootDiv) {
            // Hacking docusaurus to insert a banner
            const mainContainer = document.getElementById('__docusaurus');
            rootDiv = document.createElement('div');
            rootDiv.setAttribute('id', ANNOUNCEMENT_DIV_ID);
            document.body.insertBefore(rootDiv, mainContainer);
        }
        setAnnouncementRoot(rootDiv);
    }, []);

    return announcementRoot
        ? ReactDOM.createPortal(<AnnouncementBanner />, announcementRoot)
        : null;
};
