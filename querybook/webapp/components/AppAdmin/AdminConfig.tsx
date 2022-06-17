import React, { useMemo, useState } from 'react';

import { useResource } from 'hooks/useResource';
import { AdminConfigResource } from 'resource/admin';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { Table } from 'ui/Table/Table';

export const AdminConfig = ({}) => {
    const { data: querybookConfig, isLoading } = useResource(
        AdminConfigResource.get
    );
    const [filterStr, setFilterStr] = useState('');

    const processedConfigs = useMemo(
        () =>
            querybookConfig
                ? Object.entries(querybookConfig).map(([key, value]) => ({
                      key,
                      value: JSON.stringify(value ?? 'null'),
                  }))
                : [],
        [querybookConfig]
    );
    const filteredConfigs = useMemo(
        () =>
            processedConfigs.filter(
                (config) =>
                    !filterStr ||
                    config.key.toLowerCase().includes(filterStr.toLowerCase())
            ),
        [processedConfigs, filterStr]
    );

    let contentDOM = null;
    if (!isLoading) {
        contentDOM = (
            <div className="mt8 p8">
                <SearchBar
                    value={filterStr}
                    onSearch={setFilterStr}
                    placeholder="Filter Key"
                    className="mb8"
                />
                <Table
                    colNameToWidths={{ value: 200 }}
                    rows={filteredConfigs}
                    cols={['key', 'value']}
                    showAllRows={true}
                />
            </div>
        );
    }

    return (
        <div className="AdminTaskStatus">
            <div className="AdminLanding-top">
                <div className="AdminLanding-title">
                    Querybook Configuration
                </div>
                <div className="AdminLanding-desc">
                    This is a readonly view of the querybook config. Please
                    check admin_guide/infra_config.md for customization.
                </div>
            </div>
            {contentDOM}
        </div>
    );
};
