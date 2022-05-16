import { navigateWithinEnv } from 'lib/utils/query-string';
import React, { useCallback, useState } from 'react';
import { IconButton, IIconButtonProps } from 'ui/Button/IconButton';
import { TableUploaderForm } from './TableUploaderForm';
import { useQueryEnginesForUpload } from './useQueryEnginesForUpload';

export const TableUploaderButton: React.FC<
    Partial<IIconButtonProps> & { metastoreId: number }
> = ({ metastoreId, ...iconButtonProps }) => {
    const [showUploader, setShowUploader] = useState(false);
    const queryEnginesForUpload = useQueryEnginesForUpload(metastoreId);

    const handleUploadCompletion = useCallback((tableId: number) => {
        setShowUploader(false);
        navigateWithinEnv(`/table/${tableId}`);
    }, []);

    return queryEnginesForUpload.length > 0 ? (
        <>
            <IconButton
                icon="Plus"
                onClick={() => setShowUploader(true)}
                tooltip="Upload new table"
                {...iconButtonProps}
            />
            {showUploader && (
                <TableUploaderForm
                    metastoreId={metastoreId}
                    onCompletion={handleUploadCompletion}
                    onHide={() => setShowUploader(false)}
                />
            )}
        </>
    ) : (
        <div />
    );
};
