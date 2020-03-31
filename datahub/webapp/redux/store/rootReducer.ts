import { combineReducers } from 'redux';
import user from '../user/reducer';
import dataDoc from '../dataDoc/reducer';
import search from '../search/reducer';
import dataSources from '../dataSources/reducer';
import dataTableSearch from '../dataTableSearch/reducer';
import queryExecutions from '../queryExecutions/reducer';
import queryEngine from '../queryEngine/reducer';
import querySnippets from '../querySnippets/reducer';
import queryView from '../queryView/reducer';
import dataHubUI from '../dataHubUI/reducer';
import environment from '../environment/reducer';
import adhocQuery from '../adhocQuery/reducer';
import board from '../board/reducer';

export default combineReducers({
    user,
    dataDoc,
    search,
    dataSources,
    dataTableSearch,
    queryExecutions,
    querySnippets,
    queryEngine,
    queryView,
    dataHubUI,
    environment,
    adhocQuery,
    board,
});
