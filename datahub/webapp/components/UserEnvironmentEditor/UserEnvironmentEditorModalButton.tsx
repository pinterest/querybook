import React from 'react';
import { Modal } from 'ui/Modal/Modal';
import { UserEnvironmentEditor } from './UserEnvironmentEditor';
import { Button } from 'ui/Button/Button';

interface IProps {
    environmentId: number;
}

export const UserEnvironmentEditorModalButton: React.FunctionComponent<IProps> = ({
    environmentId,
}) => {
    const [showModal, setShowModal] = React.useState(false);

    let modalDOM = null;

    // TODO: FIND AND STYLE
    if (showModal) {
        modalDOM = (
            <Modal onHide={() => setShowModal(false)}>
                <UserEnvironmentEditor environmentId={environmentId} />
            </Modal>
        );
    }

    return (
        <>
            <Button
                title="Add/Remove User"
                onClick={() => setShowModal(true)}
            />
            {modalDOM}
        </>
    );
};
