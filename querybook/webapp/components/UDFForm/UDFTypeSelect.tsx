import { useField } from 'formik';
import { IOptions, makeReactSelectStyle } from 'lib/utils/react-select';
import React, { useMemo } from 'react';
import CreatableSelect from 'react-select/creatable';
import { overlayRoot } from 'ui/Overlay/Overlay';

const reactSelectStyle = makeReactSelectStyle(true);

interface IUDFTypeSelectProps {
    dataTypes: string[];
    /**
     * For formik
     */
    name: string;
}
export const UDFTypeSelect: React.FC<IUDFTypeSelectProps> = ({
    dataTypes,
    name,
}) => {
    const [field, , helper] = useField(name);
    const typeOptions: IOptions<string> = useMemo(
        () =>
            dataTypes.map((dateType) => ({
                label: dateType,
                value: dateType,
            })),
        [dataTypes]
    );

    return (
        <CreatableSelect
            isClearable
            styles={reactSelectStyle}
            value={{ label: field.value, value: field.value }}
            onChange={(option) => {
                helper.setValue(option ? option.value : '');
            }}
            menuPortalTarget={overlayRoot}
            options={typeOptions}
        />
    );
};
