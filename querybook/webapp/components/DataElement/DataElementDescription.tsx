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

    const valueName =
        typeof valueDataElement === 'object'
            ? valueDataElement.name
            : valueDataElement;
    const keyName =
        typeof keyDataElement === 'object'
            ? keyDataElement.name
            : keyDataElement;

    const valueDescription =
        typeof valueDataElement === 'object'
            ? valueDataElement.description
            : null;
    const keyDescription =
        typeof keyDataElement === 'object' ? keyDataElement.description : null;

    const mapDescrptionDOM = (
        <div>
            <KeyContentDisplay keyString={keyName}>
                <AccentText>{keyDescription}</AccentText>
            </KeyContentDisplay>
            <KeyContentDisplay keyString={valueName}>
                <AccentText>{valueDescription}</AccentText>
            </KeyContentDisplay>
        </div>
    );

    const listDescriptionDOM = (
        <div>
            <KeyContentDisplay keyString={valueName}>
                <AccentText>{valueDescription}</AccentText>
            </KeyContentDisplay>
        </div>
    );

    return (
        <div>
            <AccentText color="lightest" untitled>
                (showing data element description)
            </AccentText>
            {dataElementAssociation.type ===
            DataElementAssociationType.ARRAY ? (
                listDescriptionDOM
            ) : dataElementAssociation.type ===
              DataElementAssociationType.MAP ? (
                mapDescrptionDOM
            ) : (
                <AccentText>{valueDescription}</AccentText>
            )}
        </div>
    );
};
