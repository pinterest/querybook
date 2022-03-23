import { produce } from 'immer';

import { IScheduledDataDocState } from './types';

const initialState: Readonly<IScheduledDataDocState> = {
    docs: [],
    totalPages: 0,
    page: 0,
    pageSize: 10,
    filters: {
        scheduled_only: true,
    },
};

function scheduledDocsReducer(state = initialState, action) {
    return produce(state, (draft) => {
        switch (action.type) {
            case '@@scheduledDataDoc/RECEIVE_DOC_WITH_SCHEMA': {
                const { docs, total, pageSize, page, filters } = action.payload;

                draft.docs = docs;
                draft.totalPages = Math.ceil(total / pageSize);
                draft.page = page;
                draft.pageSize = pageSize;
                draft.filters = filters;
                return;
            }
        }
    });
}

export default scheduledDocsReducer;
