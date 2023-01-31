import React, {
    useEffect,
    useMemo,
    useState,
    useRef,
    useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Dispatch, IStoreState } from 'redux/store/types';
import { getScheduledDocs } from 'redux/scheduledDataDoc/action';
import { IScheduledDocFilters } from 'redux/scheduledDataDoc/types';
import { Checkbox } from 'ui/Checkbox/Checkbox';
import { Container } from 'ui/Container/Container';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { Pagination } from 'ui/Pagination/Pagination';
import { PrettyNumber } from 'ui/PrettyNumber/PrettyNumber';
import { AccentText, EmptyText } from 'ui/StyledText/StyledText';
import { IconButton } from 'ui/Button/IconButton';

import { DataDocScheduleItem } from './DataDocScheduleItem';
import { DataDocSchedsFilters } from './DataDocSchedsFilters';
import { UpdateFiltersType } from 'const/schedFiltersType';

import './DataDocScheduleList.scss';

function useDataDocScheduleFiltersAndPagination() {
    const {
        page: initPage,
        filters: initFilters,
        pageSize: initPageSize,
        numberOfResults,
    } = useSelector((state: IStoreState) => state.scheduledDocs);

    const [docName, setDocName] = useState(initFilters.name ?? '');

    const [extraFilters, setExtraFilters] = useState<IScheduledDocFilters>({
        status: initFilters.status ?? null,
        board_ids: initFilters.board_ids ?? [],
        scheduled_only: initFilters.scheduled_only ?? false,
    });

    const updateFilters = useCallback(({ key, value }: UpdateFiltersType) => {
        setExtraFilters((state) => ({
            ...state,
            [key]: value,
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

        if (extraFilters.board_ids) {
            _filters.board_ids = extraFilters.board_ids;
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
        updateFilters,
    } = useDataDocScheduleFiltersAndPagination();

    const dataDocsWithSchedule = useDataDocWithSchedules(
        page,
        pageSize,
        filters
    );

    const totalPages = Math.ceil(numberOfResults / pageSize);
    const [showSearchFilter, setShowSearchFilter] = useState(false);
    const filterButtonRef = useRef<HTMLAnchorElement>();

    const handleUpdateScheduledOnly = React.useCallback((value: boolean) => {
        updateFilters({
            key: 'scheduled_only',
            value,
        });
    }, []);

    const searchFiltersPickerDOM = showSearchFilter && (
        <DataDocSchedsFilters
            filters={filters}
            updateFilters={updateFilters}
            setShowSearchFilter={setShowSearchFilter}
            filterButton={filterButtonRef?.current}
        />
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
                            onChange={handleUpdateScheduledOnly}
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
