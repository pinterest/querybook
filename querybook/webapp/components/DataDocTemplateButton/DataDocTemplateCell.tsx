import { isEmpty } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { DataDocTemplateVarForm } from 'components/DataDocTemplateButton/DataDocTemplateVarForm';
import { IDataDoc } from 'const/datadoc';
import { TextButton } from 'ui/Button/Button';
import { AccentText } from 'ui/StyledText/StyledText';

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
    const hasMeta = useMemo(
        () => dataDoc.meta && !isEmpty(dataDoc.meta),
        [dataDoc.meta]
    );
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
                    icon="Plus"
                    className="mr4"
                    title="New Variable"
                    onClick={() => setShowFacde(false)}
                />
                <DataDocTemplateInfoButton style="icon" />
            </div>
        );
    } else {
        contentDOM = (
            <>
                <div className=" flex-row ph8">
                    <AccentText
                        className="mr12"
                        size="text"
                        weight="bold"
                        color="light"
                    >
                        Variables
                    </AccentText>
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
                        toast.success('Variables saved');
                    }}
                />
            </>
        );
    }

    return <div className="DataDocTemplateCell mb24 ph12">{contentDOM}</div>;
};
