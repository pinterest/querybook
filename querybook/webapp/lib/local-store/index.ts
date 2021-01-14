import localForage from 'localforage';

// PLEASE DEFINE THE TYPING OF KEY/VALUE PAIR IN CONST.TS

localForage.config({
    driver: localForage.INDEXEDDB, // Force WebSQL; same as using setDriver()
    name: 'Querybook',
    version: 1.0,
    size: 4980736, // Size of database, in bytes. WebSQL-only for now.
    storeName: 'querybook_user', // Should be alphanumeric, with underscores.
    description: 'We will store user related information here.',
});

function set<T = any>(key: string, value: T) {
    return localForage.setItem<T>(key, value);
}

function get<T = any>(key: string) {
    return localForage.getItem<T>(key);
}

export default {
    set,
    get,
};
