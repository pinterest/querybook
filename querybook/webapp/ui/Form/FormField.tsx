import clsx from 'clsx';
import React from 'react';

import { InfoButton } from 'ui/Button/InfoButton';
import { AccentText } from 'ui/StyledText/StyledText';

import './FormField.scss';

export const FormSectionHeader: React.FC = ({ children }) => (
    <div className="FormSectionHeader flex-row">
        <span>{children}</span>
    </div>
);

export type StringOrRender = string | (() => React.ReactNode);

export interface IFormFieldProps {
    stacked?: boolean;
    required?: boolean;
    label?: StringOrRender;
    help?: StringOrRender;
    error?: StringOrRender;
    className?: string;
}
export interface IFormFieldSectionProps {
    flexed?: boolean;
    className?: string;
}

export const FormField: React.FunctionComponent<IFormFieldProps> = ({
    children,
    stacked,
    label,
    help,
    required,
    error,
    className,
}) => {
    const labelDOM = label ? (
        <>
            <FormFieldLabelSection>
                {typeof label === 'function' ? label() : label}
            </FormFieldLabelSection>
            {stacked ? <div className="break-flex" /> : null}
        </>
    ) : null;

    const helpDOM = help ? (
        <FormFieldHelpSection>
            {typeof help === 'function' ? help() : help}
        </FormFieldHelpSection>
    ) : null;

    const errorDOM = error ? (
        <FormFieldErrorSection>
            {typeof error === 'function' ? error() : error}
        </FormFieldErrorSection>
    ) : null;

    const requiredIndicator = required ? (
        <span className="FormFieldRequired">*Required</span>
    ) : null;

    // If user uses props to supply label, then auto wrap children to be
    // in input section
    const contentDOM =
        labelDOM || helpDOM || errorDOM ? (
            <FormFieldInputSection>
                {children}
                {errorDOM}
            </FormFieldInputSection>
        ) : (
            children
        );

    return (
        <div
            className={clsx(
                'FormField',
                stacked && 'FormField-stacked',
                className
            )}
        >
            {labelDOM}
            {contentDOM}
            {helpDOM}
            {requiredIndicator}
        </div>
    );
};

const FormFieldLabelSection: React.FunctionComponent<
    IFormFieldSectionProps
> = ({ children, className = '' }) => (
    <AccentText
        color="light"
        weight="bold"
        className={`FormFieldLabelSection ${className}`}
    >
        {children}
    </AccentText>
);

export const FormFieldInputSectionRowGroup: React.FunctionComponent<
    IFormFieldSectionProps
> = ({ children, className = '' }) => (
    <div className={`FormFieldInputSectionRowGroup ${className}`}>
        {children}
    </div>
);

export const FormFieldInputSectionRow: React.FunctionComponent<
    IFormFieldSectionProps
> = ({ children, className = '' }) => (
    <div className={`FormFieldInputSectionRow ${className}`}>{children}</div>
);

export const FormFieldInputSection: React.FunctionComponent<
    IFormFieldSectionProps
> = ({ children, className = '' }) => (
    <div className={`FormFieldInputSection ${className}`}>{children}</div>
);

export const FormFieldHelpSection: React.FunctionComponent<
    IFormFieldSectionProps
> = ({ children, className = '' }) => (
    <div className={`FormFieldHelpSection flex-center ${className}`}>
        <InfoButton
            layout={['bottom', 'right']}
            popoverClassName="FormFieldHelpSection"
        >
            {children}
        </InfoButton>
    </div>
);

export const FormFieldErrorSection: React.FunctionComponent<
    IFormFieldSectionProps
> = ({ children, className = '' }) => (
    <div className={`FormFieldErrorSection ${className}`}>{children}</div>
);
