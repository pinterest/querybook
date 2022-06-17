import { combineReducers } from 'redux';

import adhocQuery from '../adhocQuery/reducer';
import board from '../board/reducer';
import dataDoc from '../dataDoc/reducer';
import dataSources from '../dataSources/reducer';
import dataTableSearch from '../dataTableSearch/reducer';
import environment from '../environment/reducer';
import globalState from '../globalState/reducer';
import notificationService from '../notificationService/reducer';
import querybookUI from '../querybookUI/reducer';
import queryEngine from '../queryEngine/reducer';
import queryExecutions from '../queryExecutions/reducer';
import querySnippets from '../querySnippets/reducer';
import queryView from '../queryView/reducer';
import scheduledDocs from '../scheduledDataDoc/reducer';
import search from '../search/reducer';
import tag from '../tag/reducer';
import user from '../user/reducer';

export default combineReducers({
    adhocQuery,
    board,
    dataDoc,
    querybookUI,
    dataSources,
    dataTableSearch,
    environment,
    globalState,
    notificationService,
    queryEngine,
    queryExecutions,
    querySnippets,
    queryView,
    search,
    user,
    tag,
    scheduledDocs,
});
