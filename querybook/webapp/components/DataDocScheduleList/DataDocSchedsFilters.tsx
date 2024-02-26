import React, { useEffect } from 'react';
import { Formik } from 'formik';
import { debounce } from 'lodash';
import { useDispatch } from 'react-redux';
import { OptionTypeBase } from 'react-select';
import { Popover } from 'ui/Popover/Popover';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { DataDocBoardsSelect } from './DataDocBoardsSelect';
import { IScheduledDocFilters } from 'redux/scheduledDataDoc/types';
import { fetchBoards } from 'redux/board/action';
import { UpdateFiltersType, StatusType } from 'const/schedFiltersType';

const enabledOptions = [
    { key: 'all', value: 'All' },
    { key: 'enabled', value: 'Enabled' },
    { key: 'disabled', value: 'Disabled' },
];

export const DataDocSchedsFilters: React.FC<{
    setShowSearchFilter: (arg: boolean) => void;
    updateFilters: (arg: UpdateFiltersType) => void;
    filterButton: HTMLAnchorElement | null;
    filters: IScheduledDocFilters;
}> = ({ setShowSearchFilter, filters, updateFilters, filterButton }) => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(fetchBoards());
    }, []);
    const handleUpdateStatus = React.useCallback((value: StatusType) => {
        updateFilters({
            key: 'status',
            value,
        });
    }, []);

    const handleUpdateList = React.useCallback(
        debounce((params: OptionTypeBase[]) => {
            updateFilters({
                key: 'board_ids',
                value: params,
            });
        }, 500),
        []
    );
    return (
        <Popover
            layout={['bottom', 'right']}
            onHide={() => {
                setShowSearchFilter(false);
            }}
            anchor={filterButton}
        >
            <div className="DataTableNavigatorSearchFilter">
                <div className="DataDocScheduleList_select-wrapper">
                    <Formik
                        initialValues={{
                            status: '',
                            board_ids: [],
                        }}
                        onSubmit={() => undefined} // Just for fixing ts
                    >
                        {({}) => (
                            <>
                                <SimpleField
                                    label="Status"
                                    type="select"
                                    name="status"
                                    options={enabledOptions}
                                    onChange={handleUpdateStatus}
                                    value={filters.status}
                                />
                                <DataDocBoardsSelect
                                    label="Lists"
                                    name="board_ids"
                                    value={filters.board_ids}
                                    onChange={handleUpdateList}
                                />
                            </>
                        )}
                    </Formik>
                </div>
            </div>
        </Popover>
    );
};
