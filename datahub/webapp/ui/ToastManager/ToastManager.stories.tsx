import React, { useCallback } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';
import toast from 'react-hot-toast';

import { ToastManager } from './ToastManager';
import { Button } from 'ui/Button/Button';
import { sleep } from 'lib/utils';

export const _Toast = () => (
    <div>
        <div className="flex-column">
            <Button
                onClick={() => toast('This is a notification')}
                title={'Click for toast'}
            />
            <Button
                onClick={() => toast.success('This is a notification')}
                title={'Click for success toast'}
            />
            <Button
                onClick={() =>
                    toast.promise(sleep(5000), {
                        loading: 'Loading',
                        success: 'Completed!',
                        error: 'Failed :(',
                    })
                }
                title={'Click for promise toast'}
            />
        </div>

        <ToastManager />
    </div>
);

export default {
    title: 'Stateful/Toast',
    decorators: [centered],
};
