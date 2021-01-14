import React, { useEffect } from 'react';
import { useGlobalState } from 'hooks/redux/useGlobalState';
import ds from 'lib/datasource';

export const QuerybookVersion: React.FC = () => {
    const [version, setVersion] = useGlobalState('querybookVersion', null);

    useEffect(() => {
        if (version == null) {
            ds.fetch<string>(`/version/`).then(({ data }) => {
                setVersion(data);
            });
        }
    }, []);

    return <span>{version}</span>;
};
