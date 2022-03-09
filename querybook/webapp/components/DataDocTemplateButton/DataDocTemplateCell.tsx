import React, { useEffect, useMemo, useState } from 'react';

import { IDataDoc } from 'const/datadoc';

import { DataDocTemplateVarForm } from 'components/DataDocTemplateButton/DataDocTemplateVarForm';

import { isEmpty } from 'lodash';
import { TextButton } from 'ui/Button/Button';
import { Title } from 'ui/Title/Title';
import { DataDocTemplateInfoButton } from './DataDocTemplateInfoButton';

interface IProps {
    changeDataDocMeta: (docId: number, meta: Record<string, any>) => any;
    dataDoc: IDataDoc;
    isEditable?: boolean;
}

export const DataDocTemplateCell: React.FunctionComponent<IProps> = ({
    changeDataDocMeta,
    dataDoc,
    isEditable,
}) => {
    const hasMeta = useMemo(() => dataDoc.meta && !isEmpty(dataDoc.meta), [
        dataDoc.meta,
    ]);
    const [showFacade, setShowFacde] = useState(!hasMeta && isEditable);
    useEffect(() => {
        setShowFacde(!hasMeta && isEditable);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataDoc.id]);

    if (!hasMeta && !isEditable) {
        return <div className="DataDocTemplateCell mb24" />;
    }

    let contentDOM: React.ReactNode;
    if (showFacade) {
        contentDOM = (
            <div className="flex-row ">
                <TextButton
                    icon="plus"
                    className="mr4"
                    title="New Templated Variable"
                    onClick={() => setShowFacde(false)}
                />
                <DataDocTemplateInfoButton style="icon" />
            </div>
        );
    } else {
        contentDOM = (
            <>
                <div className=" flex-row ph8">
                    <Title size={6} className="mr8">
                        Variables
                    </Title>
                    <DataDocTemplateInfoButton style="icon" />
                </div>
                <DataDocTemplateVarForm
                    isEditable={isEditable}
                    templatedVariables={dataDoc.meta}
                    onSave={(meta) => {
                        changeDataDocMeta(dataDoc.id, meta);
                        if (isEmpty(meta)) {
                            setShowFacde(true);
                        }
                    }}
                />
            </>
        );
    }

    return <div className="DataDocTemplateCell mb24 ph12">{contentDOM}</div>;
};