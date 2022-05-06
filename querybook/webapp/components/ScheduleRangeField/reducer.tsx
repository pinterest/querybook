export const reducer = (state, action) => {
    switch (action.type) {
        case 'CHANGE_ACTIVE_TAB':
            return { ...state, activeTab: action.tab };

        case 'SWITCH_EDITABLE_MODE':
            return { ...state, isEditableMode: action.mode };

        case 'UPDATE_VALUES':
            return {
                ...state,
                dateRange: { ...state.dateRange, ...action.values },
            };

        case 'CANCEL_VALUES':
            return {
                ...state,
                dateRange: action.values,
                isEditableMode: false,
            };

        case 'SAVE_VALUES':
            return {
                ...state,
                dateRange: action.values,
                isEditableMode: false,
            };

        case 'RESET_VALUES':
            return {
                ...state,
                dateRange: {},
                isEditableMode: false,
            };
        default:
            return state;
    }
};
