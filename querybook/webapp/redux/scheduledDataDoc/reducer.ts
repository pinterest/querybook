import { produce } from 'immer';

import { IScheduledDataDocState } from './types';

const initialState: Readonly<IScheduledDataDocState> = {
    docs: [],
    totalPages: 0,
    page: 0,
    pageSize: 10,
    filtered: '',
};

function scheduledDocsReducer(state = initialState, action) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@dataDoc/RECEIVE_DATA_WITH_SCHEMA': {
                const {
                    docs,
                    total,
                    pageSize,
                    page,
                    filtered,
                } = action.payload;

                draft.docs = docs;
                draft.totalPages = Math.ceil(total / pageSize);
                draft.page = page;
                draft.pageSize = pageSize;
                draft.filtered = filtered;
                return;
            }
        }
    });
}

export default scheduledDocsReducer;
