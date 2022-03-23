import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Dispatch, IStoreState } from 'redux/store/types';
import { getScheduledDocs } from 'redux/scheduledDataDoc/action';

import { IScheduledDocFilters } from 'redux/scheduledDataDoc/types';
import { DataDocScheduleItem } from './DataDocScheduleItem';
import { Pagination } from 'ui/Pagination/Pagination';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { Checkbox } from 'ui/Checkbox/Checkbox';
import { Container } from 'ui/Container/Container';
import { EmptyText } from 'ui/StyledText/StyledText';

import './DataDocScheduleList.scss';

function useDataDocScheduleFiltersAndPagination() {
    const {
        page: initPage,
        filters: initFilters,
        pageSize: initPageSize,
        totalPages,
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

        totalPages,
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

        totalPages,

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

    return (
        <Container>
            <div className="DataDocScheduleList">
                <div className="horizontal-space-between mb16">
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
                {dataDocsWithSchedule.map((docWithSchedule) => (
                    <DataDocScheduleItem
                        docWithSchedule={docWithSchedule}
                        key={docWithSchedule.doc.id}
                    />
                ))}
                {dataDocsWithSchedule.length === 0 && (
                    <EmptyText>
                        {filters.scheduled_only
                            ? 'No Scheduled DataDocs'
                            : 'No DataDocs'}
                    </EmptyText>
                )}
                {totalPages > 1 && (
                    <Pagination
                        currentPage={page}
                        totalPage={totalPages}
                        onPageClick={setPage}
                    />
                )}
            </div>
        </Container>
    );
};

export default DataDocScheduleList;
