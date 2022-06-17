import React from 'react';

import { DataDoc } from 'components/DataDoc/DataDoc';
import { FullHeight } from 'ui/FullHeight/FullHeight';

interface IProps {
    id: number;
}

const EmbeddedDataDocPage: React.FunctionComponent<IProps> = ({ id }) => (
    <FullHeight flex={'column'} className="EmbeddedDataDocPage">
        <div>
            <DataDoc docId={id} />
        </div>
    </FullHeight>
);

export default EmbeddedDataDocPage;
