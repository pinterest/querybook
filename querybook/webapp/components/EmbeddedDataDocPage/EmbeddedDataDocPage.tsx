import React from 'react';
import { FullHeight } from 'ui/FullHeight/FullHeight';
import './EmbeddedDataDocPage.scss';
import { DataDoc } from 'components/DataDoc/DataDoc';

const EmbeddedDataDocPage: React.FunctionComponent = ({id}) => {
    return (
        <FullHeight flex={'column'} className="EmbeddedDataDocPage">
            <div className="datadoc-wrapper">
                <DataDoc docId={id} />
            </div>
        </FullHeight>
    );
};

export default EmbeddedDataDocPage;
