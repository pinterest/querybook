import qs from 'qs';
import history from 'lib/router-history';
import { reduxStore } from 'redux/store';
import { IStoreState } from 'redux/store/types';
import { currentEnvironmentSelector } from 'redux/environment/selector';

export function getQueryString(): {} {
    return qs.parse(location.search.slice(1));
}

export function replaceQueryString(params: {}, navigate: boolean = false) {
    const mergedParams = {
        ...getQueryString(),
        ...params,
    };

    if (navigate) {
        history.push({
            pathname: history.location.pathname,
            search: `?${qs.stringify(mergedParams)}`,
        });
    } else {
        history.replace({
            pathname: history.location.pathname,
            search: `?${qs.stringify(mergedParams)}`,
            state: history.location.state,
        });
    }
}

export function navigateWithinEnv(
    path: string,
    state?: any,
    replace: boolean = false
) {
    const currentEnv = getCurrentEnv();
    path = path.startsWith('/') ? path.slice(1) : path;

    const navigateFunc = replace ? history.replace : history.push;

    navigateFunc(`/${currentEnv.name}/${path}`, state);
}

export function getCurrentEnv() {
    return currentEnvironmentSelector(reduxStore.getState() as IStoreState);
}
