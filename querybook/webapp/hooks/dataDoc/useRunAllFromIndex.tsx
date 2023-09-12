import React, { useCallback, useRef } from 'react';
import { sendConfirm } from '../../lib/querybookUI';
import { DataDocRunAllButtonConfirm } from '../../components/DataDocRightSidebar/DataDocRunAllButtonConfirm';
import { trackClick } from '../../lib/analytics';
import { ComponentType, ElementType } from '../../const/analytics';
import toast from 'react-hot-toast';
import { DataDocResource } from '../../resource/dataDoc';

export function useRunAllFromIndex(docId: number, index?: number) {
    const header =
        index === undefined ? 'Run All Cells' : 'Run all cells below';

    const notification = useRef(true);

    const onRunAll = useCallback(() => {
        sendConfirm({
            header,
            message: (
                <DataDocRunAllButtonConfirm
                    defaultNotification={notification.current}
                    onNotificationChange={(value) => {
                        notification.current = value;
                    }}
                    docId={docId}
                    index={index}
                />
            ),
            onConfirm: () => {
                trackClick({
                    component: ComponentType.DATADOC_PAGE,
                    element: ElementType.RUN_ALL_FROM_CELL_BUTTON,
                });
                toast.promise(
                    DataDocResource.run(docId, notification.current, index),
                    {
                        loading: null,
                        success: 'DataDoc execution started!',
                        error: 'Failed to start the execution',
                    }
                );
            },
            confirmText: 'Run',
        });
        return null;
    }, [docId, notification]);
    return onRunAll;
}
