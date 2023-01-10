import { OptionTypeBase } from 'react-select';

export type StatusType = 'all' | 'enabled' | 'disabled';

export type UpdateFiltersType =
    | { key: 'status'; value: StatusType }
    | { key: 'scheduled_only'; value: boolean }
    | { key: 'board_ids'; value: OptionTypeBase[] };
