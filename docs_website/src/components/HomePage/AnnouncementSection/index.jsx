import React from 'react';
import * as ReactDOM from 'react-dom';

import './index.scss';

const ANNOUNCEMENT_DIV_ID = '__announcement_root';

const AnnouncementBanner = () => null;

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
