import * as React from 'react';

import { useDebounce } from 'hooks/useDebounce';
import { useResource } from 'hooks/useResource';
import {
    makeReactSelectStyle,
    miniReactSelectStyles,
} from 'lib/utils/react-select';
import { DataElementResource } from 'resource/table';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';

import './DataElement.scss';

interface IProps {
    onSelect: (val: string) => any;
    existingDataElements?: string[];
}

const dataElementReactSelectStyle = makeReactSelectStyle(
    true,
    miniReactSelectStyles
);

export const DataElementSelect: React.FunctionComponent<IProps> = ({
    onSelect,
    existingDataElements = [],
}) => {
    const [dataElementString, setDataElementString] = React.useState('');
    const debouncedDataElementString = useDebounce(dataElementString, 500);

    const { data: rawDataElementSuggestions } = useResource(
        React.useCallback(
            () => DataElementResource.search(debouncedDataElementString),
            [debouncedDataElementString]
        )
    );

    const dataElementSuggestions = React.useMemo(
        () =>
            (rawDataElementSuggestions || []).filter(
                (str) => !existingDataElements.includes(str)
            ),
        [rawDataElementSuggestions, existingDataElements]
    );

    const handleSelect = React.useCallback(
        (val: string) => {
            setDataElementString('');
            onSelect(val);
        },
        [onSelect]
    );

    return (
        <div className={'DataElementSelect'}>
            <SimpleReactSelect
                creatable={false}
                value={dataElementString}
                options={dataElementSuggestions}
                onChange={(val) => handleSelect(val)}
                selectProps={{
                    onInputChange: (newValue) => setDataElementString(newValue),
                    placeholder: 'filter by data element',
                    styles: dataElementReactSelectStyle,
                    noOptionsMessage: () => null,
                }}
                clearAfterSelect
            />
        </div>
    );
};
