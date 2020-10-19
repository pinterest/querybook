// Place your custom css/js logic here

export {};

// Use the following definitions to override default DataHub
// behavior
declare global {
    /* tslint:disable:interface-name */
    interface Window {
        // Users will see this message if they cannot
        // access any
        NO_ENVIRONMENT_MESSAGE?: string;
    }
}
