/**
 * Make sure access to pre-defined (webpack) variables are
 * sourced from here in case they get changed or needs to
 * be mocked for testing
 */

/**
 * Get the version defined by package.json
 */
export function getAppVersion() {
    return __VERSION__;
}

/**
 * Get the name of the app, defaults to 'Querybook'
 */
export function getAppName() {
    return __APPNAME__;
}
