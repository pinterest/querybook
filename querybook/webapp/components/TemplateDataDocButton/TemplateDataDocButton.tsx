import React from 'react';

import { IDataDoc } from 'const/datadoc';

import { DataDocTemplateVarForm } from 'components/TemplateDataDocButton/DataDocTemplateVarForm';

import { IconButton } from 'ui/Button/IconButton';
import { Modal } from 'ui/Modal/Modal';
import { InfoButton } from 'ui/Button/InfoButton';
import { Link } from 'ui/Link/Link';

interface IProps {
    changeDataDocMeta: (docId: number, meta: Record<string, any>) => any;
    dataDoc: IDataDoc;
    isEditable?: boolean;
}

export const TemplateDataDocButton: React.FunctionComponent<IProps> = ({
    changeDataDocMeta,
    dataDoc,
    isEditable,
}) => {
    const [showTemplateForm, setShowTemplateForm] = React.useState(false);

    const infoDOM = (
        <InfoButton layout={['bottom', 'right']}>
            <div>
                <p>
                    {'Include {{variable_name}} in your query and it will get substituted with ' +
                        'its value.'}
                    <br />
                    <br />
                    <span>Some variables are provided automatically.</span>
                    <br />
                    <br />
                    <span>Such as:</span>
                    <ul>
                        <li>
                            {
                                '* {{today}} which maps to todays date in yyyy-mm-dd format. '
                            }
                        </li>
                        <li>
                            {"* {{yesterday}} which maps to yesterday's date."}
                        </li>
                    </ul>
                </p>
                <br />
                <p>
                    {
                        'You can also include variables in variables for recursive rendering.'
                    }
                </p>
                <br />
                <p>
                    <Link
                        to={
                            'https://jinja.palletsprojects.com/en/2.11.x/templates/'
                        }
                    >
                        See the complete guide here.
                    </Link>
                </p>
            </div>
        </InfoButton>
    );

    const templatedModal = showTemplateForm ? (
        <Modal
            onHide={() => {
                setShowTemplateForm(false);
            }}
            title="Variables"
            infoDOM={infoDOM}
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
                icon="code"
                onClick={() => setShowTemplateForm(true)}
                tooltip="Set Templated Variables"
                tooltipPos="left"
                title="Template"
            />
            {templatedModal}
        </div>
    );
};
