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
        width: 12,
    },
});

export const valueFromId = (opts: IOptions, id: any) =>
    opts.find((o) => o.value === id);

export const defaultReactSelectStyles = {
    control: (styles, { isFocused, isSelected }) => ({
        ...styles,
        backgroundColor: 'var(--bg-color)',
        boxShadow: 'none',
        borderRadius: 'var(--border-radius)',
        borderColor: isFocused
            ? 'var(--focus-border-color)'
            : isSelected
            ? 'var(--focus-border-color)'
            : 'var(--border-color)',
        '&:hover': {
            borderColor: 'var(--hover-border-color)',
        },
    }),
    input: (styles) => ({
        ...styles,
        color: 'var(--text-color)',
        '&:hover': {
            color: 'var(--text-hover-color)',
        },
    }),
    placeholder: (styles) => ({
        ...styles,
        color: 'var(--light-text-color)',
    }),
    indicatorSeparator: (styles) => ({
        ...styles,
        backgroundColor: 'transparent', // invisible
    }),
    clearIndicator: (styles, { isHovered }) => ({
        ...styles,
        color: isHovered ? 'var(--text-hover-color)' : 'var(--text-color)',
        '&:hover': {
            color: 'var(--text-hover-color)',
        },
    }),
    dropdownIndicator: (styles) => ({
        ...styles,
        color: 'var(--text-color)',
        '&:hover': {
            color: 'var(--text-hover-color)',
        },
    }),
    option: (
        styles,
        { data, isDisabled, isSelected, isHovered, isFocused }
    ) => ({
        ...styles,
        backgroundColor: isDisabled
            ? 'var(--color-null)'
            : isSelected
            ? 'var(--select-bg-color)'
            : isHovered || isFocused
            ? 'var(--hover-bg-color)'
            : 'inherit',
        color:
            isHovered || isFocused
                ? 'var(--text-hover-color)'
                : 'var(--text-color)',
        cursor: isDisabled ? 'not-allowed' : 'default',
        ...(data.color ? dot(data.color) : {}),
    }),
    menu: (styles) => ({
        ...styles,
        backgroundColor: 'var(--bg-color)',
    }),
    singleValue: (styles, { data }) => ({
        ...styles,
        color: 'var(--title-color)',
        ...(data.color ? dot(data.color) : {}),
    }),
    multiValue: (styles, { data }) => ({
        ...styles,
        backgroundColor: data.color || 'var(--light-bg-color)',
        color: data.color ? '#000' : 'var(--text-color)',
        ':hover': {
            backgroundColor: 'var(--hover-bg-color)',
            color: 'var(--text-color)',
        },
    }),
    multiValueLabel: (styles) => ({
        ...styles,
        color: 'inherit',
        ':hover': {
            backgroundColor: 'inherit',
            color: 'inherit',
        },
    }),
    multiValueRemove: (styles) => ({
        ...styles,
        color: 'inherit',
        ':hover': {
            backgroundColor: 'inherit',
            color: 'inherit',
        },
    }),
};

export const miniReactSelectStyles = {
    ...defaultReactSelectStyles,
    control: (styles, { isFocused, isSelected }) => ({
        ...styles,
        ...defaultReactSelectStyles.control(styles, { isFocused, isSelected }),
        padding: '0px',
        margin: '0px,',
        minHeight: '0px',
        '&:hover': {
            borderColor: 'var(--hover-border-color)',
        },
    }),
    input: (styles) => ({
        ...styles,
        ...defaultReactSelectStyles.input(styles),
        padding: '0px',
        margin: '0px,',
        minHeight: '0px',
    }),
    dropdownIndicator: (styles) => ({
        ...styles,
        ...defaultReactSelectStyles.dropdownIndicator(styles),
        padding: '0px 4px',
    }),
};

export function makeReactSelectStyle(
    modalMenu?: boolean,
    style?: Record<string, unknown>
) {
    let styles: Record<string, unknown> = style ?? defaultReactSelectStyles;
    if (modalMenu) {
        styles = {
            ...styles,
            menuPortal: (base) => ({
                ...base,
                zIndex: 9999,
            }),
        };
    }

    return styles;
}
