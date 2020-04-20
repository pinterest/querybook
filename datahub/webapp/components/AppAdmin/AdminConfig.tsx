import React, { useMemo, useState } from 'react';
import { useDataFetch } from 'hooks/useDataFetch';
import { Table } from 'ui/Table/Table';
import { SearchBar } from 'ui/SearchBar/SearchBar';

export const AdminConfig = ({}) => {
    const { data: datahubConfig, isLoading } = useDataFetch<{}>({
        url: '/admin/datahub_config/',
    });
    const [filterStr, setFilterStr] = useState('');

    const processedConfigs = useMemo(
        () =>
            datahubConfig
                ? Object.entries(datahubConfig).map(([key, value]) => ({
                      key,
                      value: JSON.stringify(value ?? 'null'),
                  }))
                : [],
        [datahubConfig]
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
                    className="mb4"
                />
                <Table
                    colNameToWidths={{ key: 300 }}
                    rows={filteredConfigs}
                    cols={['key', 'value']}
                    showAllRows={true}
                />
            </div>
        );
    }

    return (
        <div className="AdminJobStatus">
            <div className="AdminLanding-top">
                <div className="AdminLanding-title">DataHub Configuration</div>
                <div className="AdminLanding-desc">
                    This is a readonly view of the datahub config. Please check
                    admin_guide/infra_config.md for customization.
                </div>
            </div>
            {contentDOM}
        </div>
    );
};
