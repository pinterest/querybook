import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Dispatch, IStoreState } from 'redux/store/types';
import { getScheduledDocs } from 'redux/scheduledDataDoc/action';
import { setCollapsed } from 'redux/querybookUI/action';

import './DataDocScheduleList.scss';
import { IScheduledDocFilters } from 'redux/scheduledDataDoc/types';
import { Pagination } from 'ui/Pagination/Pagination';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { Checkbox } from 'ui/Checkbox/Checkbox';
import { DataDocScheduleItem } from './DataDocScheduleItem';
import { Container } from 'ui/Container/Container';

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

function useCollapseSidebar() {
    const dispatch: Dispatch = useDispatch();
    const collapsed: boolean = useSelector(
        (state: IStoreState) => state.querybookUI.isEnvCollapsed
    );
    useEffect(() => {
        // or better option is to add two actions and move it to reducer?
        const restoredValue = collapsed;
        dispatch(setCollapsed(true));

        return () => {
            dispatch(setCollapsed(restoredValue));
        };
    }, []);
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
    useCollapseSidebar();

    return (
        <Container className="DataDocScheduleList">
            <div className="horizontal-space-between mb12">
                <div className="flex1 mr12">
                    <DebouncedInput
                        value={filters.name}
                        onChange={setDocName}
                        inputProps={{
                            placeholder: 'Filter By Name',
                        }}
                    />
                </div>

                <div>
                    <Checkbox
                        title="Scheduled Only"
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
            {totalPages > 1 && (
                <Pagination
                    currentPage={page}
                    totalPage={totalPages}
                    onPageClick={setPage}
                />
            )}
        </Container>
    );
};

export default DataDocScheduleList;
