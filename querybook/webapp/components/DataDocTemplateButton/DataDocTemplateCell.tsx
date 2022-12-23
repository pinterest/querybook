import React, { useEffect, useMemo, useState } from 'react';

import { DataDocTemplateVarForm } from 'components/DataDocTemplateButton/DataDocTemplateVarForm';
import { IDataDoc, IDataDocMeta } from 'const/datadoc';
import { TextButton } from 'ui/Button/Button';
import { AccentText } from 'ui/StyledText/StyledText';

import { DataDocTemplateInfoButton } from './DataDocTemplateInfoButton';

interface IProps {
    changeDataDocMeta: (docId: number, meta: IDataDocMeta) => Promise<void>;
    dataDoc: IDataDoc;
    isEditable?: boolean;
}

export const DataDocTemplateCell: React.FunctionComponent<IProps> = ({
    changeDataDocMeta,
    dataDoc,
    isEditable,
}) => {
    const hasMeta = useMemo(
        () => dataDoc.meta.variables.length > 0,
        [dataDoc.meta]
    );
    const [showFacade, setShowFacade] = useState(!hasMeta && isEditable);
    useEffect(() => {
        setShowFacade(!hasMeta && isEditable);
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
                    onClick={() => setShowFacade(false)}
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
                    variables={dataDoc.meta.variables}
                    onSave={(newVariables) => {
                        if (newVariables.length === 0) {
                            setShowFacade(true);
                        }
                        return changeDataDocMeta(dataDoc.id, {
                            ...dataDoc.meta,
                            variables: newVariables,
                        });
                    }}
                />
            </>
        );
    }

    return <div className="DataDocTemplateCell mb24 ph12">{contentDOM}</div>;
};
