import React, { useMemo } from 'react';

import { StatementResultTable } from 'components/StatementResultTable/StatementResultTable';
import { IDataTableSamples } from 'const/metastore';
import { downloadString } from 'lib/utils';
import { tableToCSV, tableToTSV } from 'lib/utils/table-export';
import { TextButton } from 'ui/Button/Button';
import { CopyButton } from 'ui/CopyButton/CopyButton';

export const SamplesTableView: React.FunctionComponent<{
    samples: IDataTableSamples;
    tableName: string;
    numberOfRows?: number;
}> = ({ samples, numberOfRows, tableName }) => {
    const processedData: string[][] = useMemo(
        () =>
            samples?.value.map((row) =>
                row.map((value) =>
                    typeof value === 'string'
                        ? value
                        : value?._isBigNumber || typeof value === 'number'
                        ? value.toString()
                        : // this is for functions, objects and arrays
                          JSON.stringify(value)
                )
            ),
        [samples?.value]
    );

    const tableDOM = (
        <StatementResultTable
            data={processedData}
            paginate={true}
            maxNumberOfRowsToShow={numberOfRows}
        />
    );

    return (
        <div className="QuerybookTableViewSamples pb24">
            <div className="flex-row right-align">
                <TextButton
                    title="Download as csv"
                    onClick={() => {
                        downloadString(
                            tableToCSV(processedData),
                            `${tableName}_samples.csv`,
                            'text/csv'
                        );
                    }}
                    icon="Download"
                    size="small"
                />
                <span className="mr8" />
                <CopyButton
                    title="Copy as tsv"
                    copyText={() => tableToTSV(processedData)}
                    size="small"
                    type="text"
                />
            </div>

            {tableDOM}
        </div>
    );
};
