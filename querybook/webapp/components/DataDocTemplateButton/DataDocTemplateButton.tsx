import React from 'react';
import toast from 'react-hot-toast';

import { DataDocTemplateVarForm } from 'components/DataDocTemplateButton/DataDocTemplateVarForm';
import { IDataDoc } from 'const/datadoc';
import { IconButton } from 'ui/Button/IconButton';
import { Modal } from 'ui/Modal/Modal';

import { DataDocTemplateInfoButton } from './DataDocTemplateInfoButton';

interface IProps {
    changeDataDocMeta: (docId: number, meta: Record<string, any>) => any;
    dataDoc: IDataDoc;
    isEditable?: boolean;
}

export const DataDocTemplateButton: React.FunctionComponent<IProps> = ({
    changeDataDocMeta,
    dataDoc,
    isEditable,
}) => {
    const [showTemplateForm, setShowTemplateForm] = React.useState(false);

    const templatedModal = showTemplateForm ? (
        <Modal
            onHide={() => {
                setShowTemplateForm(false);
            }}
            title="Variables"
            topDOM={<DataDocTemplateInfoButton />}
        >
            <DataDocTemplateVarForm
                isEditable={isEditable}
                templatedVariables={dataDoc.meta}
                onSave={(meta) => {
                    changeDataDocMeta(dataDoc.id, meta);
                    setShowTemplateForm(false);
                    toast.success('Variables saved');
                }}
            />
        </Modal>
    ) : null;

    return (
        <div>
            <IconButton
                icon="Code"
                onClick={() => setShowTemplateForm(true)}
                tooltip="Set Variables"
                tooltipPos="left"
                title="Template"
            />
            {templatedModal}
        </div>
    );
};
