import React from 'react';
import { FullHeight } from 'ui/FullHeight/FullHeight';
import { DataDoc } from 'components/DataDoc/DataDoc';

const EmbeddedDataDocPage: React.FunctionComponent = ({id}) => {
    return (
        <FullHeight flex={'column'} className="EmbeddedDataDocPage">
            <DataDoc docId={id} />
        </FullHeight>
    );
};

export default EmbeddedDataDocPage;
