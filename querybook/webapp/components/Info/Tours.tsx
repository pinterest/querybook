import * as React from 'react';

import { useCreateDataDoc } from 'hooks/dataDoc/useCreateDataDoc';
import { getAppName } from 'lib/utils/global';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { Card } from 'ui/Card/Card';

import './Tours.scss';

export const Tours: React.FunctionComponent = () => {
    const handleDataDocTour = useCreateDataDoc(true);

    return (
        <div className="Tours">
            <div className="Tours-cards flex-center mv24">
                <Card
                    title={`${getAppName()} Tour`}
                    onClick={() => navigateWithinEnv('/?tour=true')}
                >
                    General overview of {getAppName()} functionalities
                </Card>
                <Card
                    title="DataDoc Tour"
                    onClick={handleDataDocTour}
                    className="ml24"
                >
                    Overview of DataDoc functionalities
                </Card>
            </div>
        </div>
    );
};
