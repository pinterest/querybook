import React from 'react';

import { DataDocTemplateVarForm } from 'components/DataDocTemplateButton/DataDocTemplateVarForm';
import { IDataDoc, IDataDocMeta } from 'const/datadoc';
import { IconButton } from 'ui/Button/IconButton';
import { Modal } from 'ui/Modal/Modal';

import { DataDocTemplateInfoButton } from './DataDocTemplateInfoButton';

interface IProps {
    changeDataDocMeta: (docId: number, meta: IDataDocMeta) => Promise<void>;
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
                variables={dataDoc.meta.variables}
                onSave={(variables) => {
                    setShowTemplateForm(false);
                    return changeDataDocMeta(dataDoc.id, {
                        ...dataDoc.meta,
                        variables,
                    });
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
