import React from 'react';
import styled from 'styled-components';
import { NumFontSize, numFontSizeToString } from 'const/font';

interface ISharedProps {
    minLabelWidth?: string;
    className?: string;
}

const StyledFormWrapper = styled.div.attrs<
    {
        fontSize: string;
        errorFontSize: string;
        sectionFontSize: string;
    } & ISharedProps
>({
    className: ' ',
})`
    font-size: ${(props) => props.fontSize};

    .FormField {
        .FormFieldLabelSection {
            ${(props) =>
                props.minLabelWidth && `min-width: ${props.minLabelWidth}`};
        }

        .FormFieldErrorSection {
            font-size: ${(props) => props.errorFontSize};
        }
    }

    .FormSectionHeader span {
        font-size: ${(props) => props.sectionFontSize};
    }
`;

export const FormWrapper: React.FC<
    {
        size?: NumFontSize;
    } & ISharedProps
> = ({ size = 6, children, ...styleProps }) => {
    const sectionFontSize = numFontSizeToString[Math.max(size - 1, 1)];
    const fontSize = numFontSizeToString[size];
    const errorFontSize = numFontSizeToString[Math.min(size + 1, 9)];

    return (
        <StyledFormWrapper
            fontSize={fontSize}
            sectionFontSize={sectionFontSize}
            errorFontSize={errorFontSize}
            {...styleProps}
        >
            {children}
        </StyledFormWrapper>
    );
};
