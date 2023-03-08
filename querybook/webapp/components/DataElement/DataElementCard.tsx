import React, { useCallback } from 'react';

import { IDataElement } from 'const/dataElement';
import { DataElementResource } from 'resource/table';
import { IconButton } from 'ui/Button/IconButton';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';
import { AccentText } from 'ui/StyledText/StyledText';

import './DataElement.scss';

interface IProps {
    dataElement: IDataElement;
}

export const DataElementCard = ({ dataElement }: IProps) => {
    const { id, name, type, description, properties } = dataElement;

    const onExternalLinkClick = useCallback(async () => {
        const { data: link } = await DataElementResource.getMetastoreLink(id);
        window.open(link, '_blank');
    }, [id]);

    const propertiesDOM = Object.entries(properties ?? {}).map(
        ([key, value]) => (
            <KeyContentDisplay key={key} keyString={key}>
                {value}
            </KeyContentDisplay>
        )
    );

    return (
        <div className="DataElementCard">
            <div>
                <div className="horizontal-space-between">
                    <AccentText color="dark" weight="bold" size="xsmall">
                        Data Element
                    </AccentText>
                    <IconButton
                        icon="ExternalLink"
                        size={18}
                        className="p0 ml8"
                        tooltip="Open the data element in the external metastore"
                        onClick={onExternalLinkClick}
                    />
                </div>
                <AccentText color="light" size="xsmall">
                    {name}
                </AccentText>
            </div>
            <div className="mt8">
                <AccentText color="dark" weight="bold" size="xsmall">
                    Type
                </AccentText>
                <AccentText color="light" size="xsmall">
                    {type}
                </AccentText>
            </div>
            <div className="mt8">
                <AccentText color="dark" weight="bold" size="xsmall">
                    Description
                </AccentText>
                <AccentText color="light" size="xsmall">
                    {description}
                </AccentText>
            </div>
            <div className="mt8">
                <AccentText color="dark" weight="bold" size="xsmall">
                    Properties
                </AccentText>
                <div className="members-container">{propertiesDOM}</div>
            </div>
        </div>
    );
};
