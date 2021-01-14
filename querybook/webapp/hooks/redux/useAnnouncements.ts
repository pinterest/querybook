import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { visibleAnnouncementSelector } from 'redux/querybookUI/selector';

export const useAnnouncements = () => {
    const location = useLocation();
    const visibleAnnouncements = useSelector(visibleAnnouncementSelector);

    return useMemo(
        () =>
            visibleAnnouncements.filter((a) => {
                if (a.url_regex) {
                    const regexPattern = new RegExp(a.url_regex);
                    const regexMatched = location.pathname.match(regexPattern);
                    if (!regexMatched) {
                        return false;
                    }
                }
                return true;
            }),
        [location, visibleAnnouncements]
    );
};
