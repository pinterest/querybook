import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';
import toast from 'react-hot-toast';

import { ToastManager } from './ToastManager';
import { Button } from 'ui/Button/Button';
import { sleep } from 'lib/utils';

export const _Toast = (args) => (
    <div>
        <div className="flex-column">
            <Button
                onClick={() =>
                    toast('This is a notification', {
                        duration: args.toastDuration,
                    })
                }
                title={'Click for toast'}
            />
            <Button
                onClick={() =>
                    toast.success('This is a notification', {
                        duration: args.toastDuration,
                    })
                }
                title={'Click for success toast'}
            />
            <Button
                onClick={() =>
                    toast.promise(sleep(args.promiseDuration), {
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

_Toast.args = {
    promiseDuration: 5000,
    toastDuration: 4000,
};

export default {
    title: 'Stateful/Toast',
    decorators: [centered],
};
