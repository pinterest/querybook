import React from 'react';

import { DataDocTemplateVarForm } from 'components/DataDocTemplateButton/DataDocTemplateVarForm';
import { ComponentType, ElementType } from 'const/analytics';
import { IDataDoc, IDataDocMeta } from 'const/datadoc';
import { trackClick } from 'lib/analytics';
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
                onClick={() => {
                    trackClick({
                        component: ComponentType.DATADOC_PAGE,
                        element: ElementType.TEMPLATE_CONFIG_BUTTON,
                    });
                    setShowTemplateForm(true);
                }}
                tooltip="Set Variables"
                tooltipPos="left"
                title="Template"
            />
            {templatedModal}
        </div>
    );
};
