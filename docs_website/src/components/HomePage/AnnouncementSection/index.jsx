import * as ReactDOM from 'react-dom';
import React from 'react';
import Link from '@docusaurus/Link';
import './index.scss';

// Hacking docusaurus to insert a banner
const mainContainer = document.getElementById('__docusaurus');
const announcementRoot = document.createElement('div');
document.body.insertBefore(announcementRoot, mainContainer);

const AnnouncementBanner = () => (
    <div className="AnnouncementSection">
        <p>
            🚀 March 30 2021 update: We just <b>open sourced Querybook</b> and
            published our first{' '}
            <b>
                <Link to="https://google.com">blog post</Link>
            </b>{' '}
            🚀
        </p>
    </div>
);

export default () => {
    return ReactDOM.createPortal(<AnnouncementBanner />, announcementRoot);
};
