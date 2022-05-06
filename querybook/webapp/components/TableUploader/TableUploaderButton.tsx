import React, { useState } from 'react';
import { IconButton, IIconButtonProps } from 'ui/Button/IconButton';
import { Modal } from 'ui/Modal/Modal';
import { TableUploaderForm } from './TableUploaderForm';

export const TableUploaderButton: React.FC<
    Partial<IIconButtonProps> & { metastoreId: number }
> = ({ metastoreId, ...iconButtonProps }) => {
    const [showUploader, setShowUploader] = useState(false);

    return (
        <>
            <IconButton
                icon="Plus"
                onClick={() => setShowUploader(true)}
                tooltip="Upload new table"
                {...iconButtonProps}
            />
            {showUploader && (
                <Modal onHide={() => setShowUploader(false)}>
                    <TableUploaderForm metastoreId={metastoreId} />
                </Modal>
            )}
        </>
    );
};
