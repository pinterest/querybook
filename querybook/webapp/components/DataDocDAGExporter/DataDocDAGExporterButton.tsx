import React from 'react';

import { ComponentType, ElementType } from 'const/analytics';
import { trackClick } from 'lib/analytics';
import { IconButton } from 'ui/Button/IconButton';
import { Modal } from 'ui/Modal/Modal';

import { DataDocDAGExporter } from './DataDocDAGExporter';

interface IProps {
    docId: number;
}

export const DataDocDAGExporterButton: React.FunctionComponent<IProps> = ({
    docId,
}) => {
    const [showModal, setShowModal] = React.useState(false);

    return (
        <>
            <IconButton
                icon="Network"
                onClick={() => {
                    trackClick({
                        component: ComponentType.DATADOC_PAGE,
                        element: ElementType.DAG_EXPORTER_BUTTON,
                    });
                    setShowModal(true);
                }}
                tooltip="DAG Exporter"
                tooltipPos="left"
                title="Exporter"
            />
            {showModal ? (
                <Modal onHide={() => setShowModal(false)} type="fullscreen">
                    <DataDocDAGExporter
                        docId={docId}
                        onClose={() => setShowModal(false)}
                    />
                </Modal>
            ) : null}
        </>
    );
};
