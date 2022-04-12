import React from 'react';

import { IconButton } from 'ui/Button/IconButton';
import { Modal } from 'ui/Modal/Modal';
import { DataDocDAGExporter } from './DataDocDAGExporter';

interface IProps {
    docId: number;
    isEditable: boolean;
}

export const DataDocDAGExporterButton: React.FunctionComponent<IProps> = ({
    docId,
    isEditable,
}) => {
    const [showModal, setShowModal] = React.useState(false);

    return (
        <div>
            <IconButton
                icon="Network"
                onClick={() => setShowModal(true)}
                tooltip="DAG Exporter"
                tooltipPos="left"
                title="Exporter"
            />
            {showModal ? (
                <Modal
                    onHide={() => setShowModal(false)}
                    title="DAG Exporter"
                    type="fullscreen"
                >
                    <DataDocDAGExporter docId={docId} isEditable={isEditable} />
                </Modal>
            ) : null}
        </div>
    );
};
