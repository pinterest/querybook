import { QueryEngineStatus } from 'const/queryEngine';
import { Status } from 'const/queryStatus';

export const queryEngineStatusToIconStatus = {
    [QueryEngineStatus.UNAVAILABLE]: Status.none,
    [QueryEngineStatus.GOOD]: Status.success,
    [QueryEngineStatus.WARN]: Status.warning,
    [QueryEngineStatus.ERROR]: Status.error,
};

export const queryEngineStatusToMessage = {
    [QueryEngineStatus.UNAVAILABLE]: 'no info',
    [QueryEngineStatus.GOOD]: 'normal',
    [QueryEngineStatus.WARN]: 'slow',
    [QueryEngineStatus.ERROR]: 'engine down',
};
