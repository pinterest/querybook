import React from 'react';
import { Toaster } from 'react-hot-toast';

export const ToastManager: React.FC = () => (
    <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
            // Define default options
            style: {
                padding: '12px',
                marginBottom: '12px',
                backgroundColor: 'var(--bg-light)',
                color: 'var(--text-dark)',
                zIndex: 301,
                borderRadius: 'var(--border-radius)',
            },
            success: {
                duration: 3000,
            },
        }}
    />
);
