import React from 'react';
import { FullHeight } from 'ui/FullHeight/FullHeight';
import { DataDoc } from 'components/DataDoc/DataDoc';

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
