import { IAdhocQuery } from 'const/adhocQuery';
import localStore from 'lib/local-store';
import { ADHOC_QUERY_KEY, AdhocQueryValue } from 'lib/local-store/const';

function getAdhocQueryStorageKey(environmentId: number) {
    return `${ADHOC_QUERY_KEY}_${environmentId}`;
}

export function saveAdhocQuery(adhocQuery: IAdhocQuery, environmentId: number) {
    return localStore.set<AdhocQueryValue>(
        getAdhocQueryStorageKey(environmentId),
        adhocQuery
    );
}

export function loadAdhocQuery(environmentId: number) {
    return localStore.get<AdhocQueryValue>(
        getAdhocQueryStorageKey(environmentId)
    );
}
