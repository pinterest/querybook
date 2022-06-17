import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getScheduledDocs } from 'redux/scheduledDataDoc/action';
import { IScheduledDocFilters } from 'redux/scheduledDataDoc/types';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Checkbox } from 'ui/Checkbox/Checkbox';
import { Container } from 'ui/Container/Container';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { Pagination } from 'ui/Pagination/Pagination';
import { PrettyNumber } from 'ui/PrettyNumber/PrettyNumber';
import { AccentText, EmptyText } from 'ui/StyledText/StyledText';

import { DataDocScheduleItem } from './DataDocScheduleItem';

import './DataDocScheduleList.scss';

function useDataDocScheduleFiltersAndPagination() {
    const {
        page: initPage,
        filters: initFilters,
        pageSize: initPageSize,
        numberOfResults,
    } = useSelector((state: IStoreState) => state.scheduledDocs);

    const [docName, setDocName] = useState(initFilters.name ?? '');
    const [scheduledOnly, setScheduledOnly] = useState(
        initFilters.scheduled_only ?? false
    );

    const filters: IScheduledDocFilters = useMemo(() => {
        const _filters: IScheduledDocFilters = {};
        if (docName) {
            _filters.name = docName;
        }
        if (scheduledOnly) {
            _filters.scheduled_only = true;
        }
        return _filters;
    }, [docName, scheduledOnly]);

    const [page, setPage] = useState(initPage);
    const [pageSize, setPageSize] = useState(initPageSize);

    return {
        filters,
        setDocName,
        setScheduledOnly,

        numberOfResults,
        page,
        setPage,
        pageSize,
        setPageSize,
    };
}

function useDataDocWithSchedules(
    page: number,
    pageSize: number,
    filters: IScheduledDocFilters
) {
    const dispatch: Dispatch = useDispatch();
    useEffect(() => {
        dispatch(
            getScheduledDocs({
                paginationPage: page,
                paginationPageSize: pageSize,
                paginationFilter: filters,
            })
        );
    }, [page, pageSize, filters, dispatch]);
    const dataDocsWithSchedule = useSelector(
        (state: IStoreState) => state.scheduledDocs.docs
    );

    return dataDocsWithSchedule;
}

const DataDocScheduleList: React.FC = () => {
    const {
        page,
        pageSize,

        numberOfResults,

        setPage,
        // Page size is fixed for now, we can
        // expand the option to let users customize
        // the number of results in future
        setPageSize,

        filters,
        setDocName,
        setScheduledOnly,
    } = useDataDocScheduleFiltersAndPagination();

    const dataDocsWithSchedule = useDataDocWithSchedules(
        page,
        pageSize,
        filters
    );

    const totalPages = Math.ceil(numberOfResults / pageSize);

    return (
        <Container>
            <div className="DataDocScheduleList">
                <div className="DataDocScheduleList-top horizontal-space-between mb16">
                    <div className="flex1 mr12">
                        <DebouncedInput
                            value={filters.name}
                            onChange={setDocName}
                            inputProps={{
                                placeholder: 'Filter by DataDoc Title',
                            }}
                        />
                    </div>
                    <div>
                        <Checkbox
                            title="Scheduled DataDocs Only"
                            value={filters.scheduled_only}
                            onChange={setScheduledOnly}
                        />
                    </div>
                </div>
                <div className="DataDocScheduleList-list">
                    {dataDocsWithSchedule.length === 0 ? (
                        <EmptyText className="mt36">
                            {filters.scheduled_only
                                ? 'No Scheduled DataDocs'
                                : 'No DataDocs'}
                        </EmptyText>
                    ) : (
                        <AccentText color="light" className="ml4 mb8">
                            <PrettyNumber val={numberOfResults} unit="result" />
                        </AccentText>
                    )}
                    {dataDocsWithSchedule.map((docWithSchedule) => (
                        <DataDocScheduleItem
                            docWithSchedule={docWithSchedule}
                            key={docWithSchedule.doc.id}
                        />
                    ))}
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={page}
                            totalPage={totalPages}
                            onPageClick={setPage}
                        />
                    )}
                </div>
            </div>
        </Container>
    );
};

export default DataDocScheduleList;
