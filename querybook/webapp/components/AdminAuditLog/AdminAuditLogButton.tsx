import React, { useState } from 'react';
import { Button } from 'ui/Button/Button';
import { AdminAuditLog, IAdminAuditLogProps } from './AdminAuditLog';
import { Modal } from 'ui/Modal/Modal';

export const AdminAuditLogButton: React.FC<IAdminAuditLogProps> = (props) => {
    const [showModal, setShowModal] = useState(false);
    const modal = showModal && (
        <Modal onHide={() => setShowModal(false)} title={'Change Logs'}>
            <AdminAuditLog {...props} />
        </Modal>
    );

    return (
        <>
            {modal}
            <Button onClick={() => setShowModal(true)} title="Change Logs" />
        </>
    );
};
