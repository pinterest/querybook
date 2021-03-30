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
            🚀 Check out our journey to open source Querybook on the&nbsp;
            <Link to="https://google.com">Pinterest Engineering Blog</Link>
        </p>
    </div>
);

export default () => {
    return ReactDOM.createPortal(<AnnouncementBanner />, announcementRoot);
};
