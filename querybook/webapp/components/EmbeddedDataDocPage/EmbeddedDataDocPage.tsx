import React from 'react';
import { FullHeight } from 'ui/FullHeight/FullHeight';
import { DataDoc } from 'components/DataDoc/DataDoc';

const EmbeddedDataDocPage: React.FunctionComponent = ({id}) => {
    return (
        <FullHeight flex={'column'} className="EmbeddedDataDocPage">
            <div>
                <DataDoc docId={id} />
            </div>
        </FullHeight>
    );
};

export default EmbeddedDataDocPage;
