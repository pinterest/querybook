import qs from 'qs';
import history from 'lib/router-history';
import { reduxStore } from 'redux/store';
import { IStoreState } from 'redux/store/types';
import { currentEnvironmentSelector } from 'redux/environment/selector';

export function getQueryString(): Record<string, any> {
    return qs.parse(location.search.slice(1));
}

export function replaceQueryString(
    params: Record<string, any>,
    navigate: boolean = false
) {
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
    subpath: string,
    state?: any,
    replace: boolean = false
) {
    const path = getWithinEnvUrl(subpath);
    const navigateFunc = replace ? history.replace : history.push;

    navigateFunc(path, state);
}

export function getWithinEnvUrl(subpath: string) {
    const currentEnv = getCurrentEnv();
    subpath = subpath.startsWith('/') ? subpath.slice(1) : subpath;
    return `/${currentEnv.name}/${subpath}`;
}

// FIXME: check why PR #856 breaks the typecasting
export function getCurrentEnv() {
    return currentEnvironmentSelector(
        (reduxStore.getState() as unknown) as IStoreState
    );
}
