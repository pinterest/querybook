import React from 'react';

import { IDataDoc } from 'const/datadoc';

import { DataDocTemplateVarForm } from 'components/DataDocTemplateButton/DataDocTemplateVarForm';
import { DataDocTemplateInfoButton } from './DataDocTemplateInfoButton';

import { IconButton } from 'ui/Button/IconButton';
import { Modal } from 'ui/Modal/Modal';

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
