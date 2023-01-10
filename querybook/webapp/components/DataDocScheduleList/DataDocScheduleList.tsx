import React, {
    useEffect,
    useMemo,
    useState,
    useRef,
    useCallback,
} from 'react';
import { debounce } from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import { Dispatch, IStoreState } from 'redux/store/types';
import { getScheduledDocs } from 'redux/scheduledDataDoc/action';

import {
    IScheduledDataDocState,
    IScheduledDocFilters,
} from 'redux/scheduledDataDoc/types';
import { Checkbox } from 'ui/Checkbox/Checkbox';
import { Container } from 'ui/Container/Container';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { Pagination } from 'ui/Pagination/Pagination';
import { PrettyNumber } from 'ui/PrettyNumber/PrettyNumber';
import { AccentText, EmptyText } from 'ui/StyledText/StyledText';
import { IconButton } from 'ui/Button/IconButton';
import { Popover } from 'ui/Popover/Popover';
import { fetchBoards } from 'redux/board/action';

import { recurrenceTypes } from 'lib/utils/cron';
import { queryDataDocFiltersSelector } from 'redux/dataDoc/selector';

import { DataDocScheduleItem } from './DataDocScheduleItem';
import Select, { OptionTypeBase } from 'react-select';
import { makeReactSelectStyle } from 'lib/utils/react-select';
import { makeSelectOptions, Select as SimpleSelect } from 'ui/Select/Select';
import { DataDocScheduleSelectionList } from './DataDocScheduleSelectionList';

import './DataDocScheduleList.scss';

const enabledOptions = [
    { key: '', value: 'All' },
    { key: true, value: 'Enabled' },
    { key: false, value: 'Disabled' },
];

const recurrenceOptions: OptionTypeBase[] = recurrenceTypes.map((type) => ({
    label: type,
    value: type,
}));

function useDataDocScheduleFiltersAndPagination() {
    const {
        page: initPage,
        filters: initFilters,
        pageSize: initPageSize,
        numberOfResults,
    } = useSelector((state: IStoreState) => state.scheduledDocs);

    const [docName, setDocName] = useState(initFilters.name ?? '');

    const [extraFilters, setExtraFilters] = useState<IScheduledDocFilters>({
        status: null,
        recurrence: [],
        list_ids: [],
        scheduled_only: initFilters.scheduled_only ?? false,
    });

    const updateFilters = useCallback((params) => {
        setExtraFilters((state) => ({
            ...state,
            ...params,
        }));
    }, []);

    const filters: IScheduledDocFilters = useMemo(() => {
        const _filters: IScheduledDocFilters = {};
        if (docName) {
            _filters.name = docName;
        }
        if (extraFilters.scheduled_only) {
            _filters.scheduled_only = true;
        }

        if (extraFilters.status !== null) {
            _filters.status = extraFilters.status;
        }

        if (extraFilters.recurrence) {
            _filters.recurrence = extraFilters.recurrence;
        }

        if (extraFilters.list_ids) {
            _filters.list_ids = extraFilters.list_ids;
        }

        return _filters;
    }, [docName, extraFilters]);

    const [page, setPage] = useState(initPage);
    const [pageSize, setPageSize] = useState(initPageSize);

    return {
        filters,
        setDocName,

        numberOfResults,
        page,
        setPage,
        pageSize,
        setPageSize,
        updateFilters,
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
                paginationFilter: {
                    ...filters,
                    list_ids: filters.list_ids?.map((l) => l.value),
                    recurrence: filters.recurrence?.map((r) => r.value),
                },
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
        updateFilters,
    } = useDataDocScheduleFiltersAndPagination();

    const dataDocsWithSchedule = useDataDocWithSchedules(
        page,
        pageSize,
        filters
    );

    const totalPages = Math.ceil(numberOfResults / pageSize);
    const [showSearchFilter, setShowSearchFilter] = useState(false);
    const filterButtonRef = useRef();
    const dispatch = useDispatch();
    const boards = useSelector(queryDataDocFiltersSelector);
    useEffect(() => {
        dispatch(fetchBoards());
    }, []);

    const handleUpdateRecurrence = React.useCallback(
        debounce((params: OptionTypeBase[]) => {
            updateFilters({
                recurrence: params,
            });
        }, 500),
        []
    );

    const handleUpdateList = React.useCallback(
        debounce((params: OptionTypeBase[]) => {
            updateFilters({
                list_ids: params,
            });
        }, 500),
        []
    );

    const reactSelectStyle = makeReactSelectStyle(true);

    const searchFiltersPickerDOM = showSearchFilter && (
        <Popover
            layout={['bottom', 'right']}
            onHide={() => {
                setShowSearchFilter(false);
            }}
            anchor={filterButtonRef.current}
        >
            <div className="DataTableNavigatorSearchFilter">
                <div className="DataDocScheduleList_select-wrapper">
                    <DataDocScheduleSelectionList label="Status">
                        <SimpleSelect
                            value={filters.status}
                            onChange={({ target: { value } }) => {
                                updateFilters({
                                    status:
                                        value === '' ? null : value === 'true',
                                });
                            }}
                        >
                            {makeSelectOptions(enabledOptions)}
                        </SimpleSelect>
                    </DataDocScheduleSelectionList>
                    <DataDocScheduleSelectionList label="Recurrence Type">
                        <Select
                            styles={reactSelectStyle}
                            value={filters.recurrence}
                            options={recurrenceOptions}
                            onChange={handleUpdateRecurrence}
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            isMulti
                        />
                    </DataDocScheduleSelectionList>
                    <DataDocScheduleSelectionList label="Lists">
                        <Select
                            styles={reactSelectStyle}
                            label="Lists"
                            value={filters.list_ids}
                            options={boards}
                            onChange={handleUpdateList}
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            isMulti
                        />
                    </DataDocScheduleSelectionList>
                </div>
            </div>
        </Popover>
    );

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

                    <IconButton
                        ref={filterButtonRef}
                        className="mr8"
                        size={'18px'}
                        noPadding
                        onClick={() => {
                            setShowSearchFilter(true);
                        }}
                        icon="Sliders"
                    />
                    {searchFiltersPickerDOM}
                    <div>
                        <Checkbox
                            title="Scheduled DataDocs Only"
                            value={filters.scheduled_only}
                            onChange={(value) => {
                                updateFilters({
                                    scheduled_only: value,
                                });
                            }}
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
