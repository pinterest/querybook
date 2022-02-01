import { StylesConfig, mergeStyles } from 'react-select';
export interface IOption<T = any> {
    label: string;
    value: T;
    color?: string; // should be visible against black text
}

export type IOptions<T = any> = Array<IOption<T>>;

const dot = (color = 'transparent') => ({
    alignItems: 'center',
    display: 'flex',

    ':before': {
        backgroundColor: color,
        borderRadius: '50%',
        content: '" "',
        display: 'block',
        marginRight: 12,
        height: 12,
        width: 12
    }
});

export const valueFromId = (opts: IOptions, id: any) =>
    opts.find((o) => o.value === id);

export const defaultReactSelectStyles: Partial<
    StylesConfig<any, false, any>
> = {
    control: (styles, { isFocused }) => ({
        ...styles,
        backgroundColor: isFocused ? 'var(--bg-lightest)' : 'var(--bg-light)',
        boxShadow: 'none',
        borderRadius: 'var(--border-radius-sm)',
        border: 'none',
        borderWidth: '0px',
        '&:hover': {
            backgroundColor: 'var(--bg-hover)'
        }
    }),
    input: (styles) => ({
        ...styles,
        color: 'var(--text-color)',
        '&:hover': {
            color: 'var(--text-hover-color)'
        }
    }),
    placeholder: (styles) => ({
        ...styles,
        color: 'var(--light-text-color)'
    }),
    indicatorSeparator: (styles) => ({
        ...styles,
        backgroundColor: 'transparent' // invisible
    }),
    clearIndicator: (styles, { isFocused }) => ({
        ...styles,
        color: isFocused ? 'var(--text-hover-color)' : 'var(--text-color)',
        '&:hover': {
            color: 'var(--text-hover-color)'
        }
    }),
    dropdownIndicator: (styles) => ({
        ...styles,
        color: 'var(--text-color)',
        '&:hover': {
            color: 'var(--text-hover-color)'
        }
    }),
    option: (styles, { data, isDisabled, isSelected, isFocused }) => ({
        ...styles,
        backgroundColor: isDisabled
            ? 'var(--color-null)'
            : isSelected
            ? 'var(--bg-light)'
            : isFocused
            ? 'var(--bg-hover)'
            : 'var(--bg-lightest)',
        color: isDisabled
            ? 'var(--light-text-color)'
            : isSelected
            ? 'var(--dark-text-color)'
            : isFocused
            ? 'var(--text-hover-color)'
            : 'var(--text-color)',
        cursor: isDisabled ? 'not-allowed' : 'default',
        ...(data.color ? dot(data.color) : {}),
        ':active': {
            ...styles[':active'],
            backgroundColor: !isDisabled ? 'var(--color-accent-bg)' : undefined,
            color: !isDisabled ? 'var(--color-accent-text)' : undefined
        }
    }),
    menu: (styles) => ({
        ...styles,
        backgroundColor: 'var(--bg-lightest)',
        borderRadius: 'var(--border-radius-sm)',
        border: 'none',
        boxShadow: 'none'
    }),
    singleValue: (styles, { data }) => ({
        ...styles,
        color: 'var(--title-color)',
        ...(data.color ? dot(data.color) : {})
    }),
    multiValue: (styles, { data }) => ({
        ...styles,
        backgroundColor: data.color || 'var(--bg-light)',
        color: data.color ? '#000' : 'var(--text-color)',
        ':hover': {
            backgroundColor: 'var(--bg-hover)',
            color: 'var(--text-color)'
        }
    }),
    multiValueLabel: (styles) => ({
        ...styles,
        color: 'inherit',
        ':hover': {
            backgroundColor: 'inherit',
            color: 'inherit'
        }
    }),
    multiValueRemove: (styles) => ({
        ...styles,
        color: 'inherit',
        ':hover': {
            backgroundColor: 'inherit',
            color: 'inherit'
        }
    })
};

export const miniReactSelectStyles: StylesConfig<any, false, any> = mergeStyles(
    defaultReactSelectStyles,
    {
        control: (styles) => ({
            ...styles,
            padding: '0px',
            margin: '0px,',
            minHeight: '0px',
            '&:hover': {
                borderColor: 'var(--hover-border-color)'
            }
        }),
        input: (styles) => ({
            ...styles,
            padding: '0px',
            margin: '0px,',
            minHeight: '0px'
        }),
        dropdownIndicator: (styles) => ({
            ...styles,
            padding: '0px 4px'
        })
    }
);

export function makeReactSelectStyle(
    modalMenu?: boolean,
    style?: Record<string, unknown>
) {
    let styles: Record<string, unknown> = style ?? defaultReactSelectStyles;
    if (modalMenu) {
        styles = mergeStyles(styles, {
            menuPortal: (base) => ({
                ...base,
                zIndex: 9999
            })
        });
    }

    return styles;
}
