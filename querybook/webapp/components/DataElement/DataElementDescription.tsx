import React from 'react';

import {
    DataElementAssociationType,
    IDataElementAssociation,
} from 'const/dataElement';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';
import { AccentText } from 'ui/StyledText/StyledText';

export const DataElementDescription = ({
    dataElementAssociation,
}: {
    dataElementAssociation: IDataElementAssociation;
}) => {
    const valueDataElement = dataElementAssociation.value;
    const keyDataElement = dataElementAssociation.key;

    const getDescriptionDOM = () => {
        const valueName =
            typeof valueDataElement === 'object'
                ? valueDataElement.name
                : valueDataElement;
        const valueDescription =
            typeof valueDataElement === 'object'
                ? valueDataElement.description
                : null;

        if (dataElementAssociation.type === DataElementAssociationType.REF) {
            return <AccentText>{valueDescription}</AccentText>;
        }

        if (dataElementAssociation.type === DataElementAssociationType.ARRAY) {
            return (
                <KeyContentDisplay keyString={valueName}>
                    <AccentText>{valueDescription}</AccentText>
                </KeyContentDisplay>
            );
        }

        if (dataElementAssociation.type === DataElementAssociationType.MAP) {
            const keyName =
                typeof keyDataElement === 'object'
                    ? keyDataElement.name
                    : keyDataElement;
            const keyDescription =
                typeof keyDataElement === 'object'
                    ? keyDataElement.description
                    : null;
            return (
                <div>
                    <KeyContentDisplay keyString={keyName}>
                        <AccentText>{keyDescription}</AccentText>
                    </KeyContentDisplay>
                    <KeyContentDisplay keyString={valueName}>
                        <AccentText>{valueDescription}</AccentText>
                    </KeyContentDisplay>
                </div>
            );
        }
    };

    return (
        <div>
            <AccentText color="lightest" untitled>
                (showing data element description)
            </AccentText>
            {getDescriptionDOM()}
        </div>
    );
};
