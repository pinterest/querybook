import React from 'react';
import styled from 'styled-components';

const StyledJsonViewer = styled.div`
    background-color: var(--light-bg-color);
    color: var(--dark-text-color);
    font-size: var(--small-text-size);
    overflow-x: auto;
    padding: 20px 24px;
    white-space: pre;
    word-wrap: normal;
`;

export interface IJsonViewerProps {
    value: string | {};
    indent?: number;
    replacerFunction?: () => any;
}

export const JsonViewer: React.FunctionComponent<IJsonViewerProps> = ({
    value = '',
    replacerFunction: defaultReplacer,
    indent = 4,
}) => {
    let jsonString = '';
    if (typeof value === 'object') {
        const replacerFunction = defaultReplacer
            ? defaultReplacer.bind(null, value)
            : null;

        jsonString = JSON.stringify(value, replacerFunction, indent);
    } else if (typeof value === 'string') {
        try {
            const valueObj = JSON.parse(value);
            const replacerFunction = defaultReplacer
                ? defaultReplacer.bind(null, valueObj)
                : null;
            jsonString = JSON.stringify(valueObj, replacerFunction, indent);
        } catch (err) {
            jsonString = `Could not parse ${value} as JSON. Please check the syntax.`;
        }
    } else {
        jsonString = '"value" is an unexpected type of: ' + typeof value;
    }

    return (
        <StyledJsonViewer className="JsonViewer">{jsonString}</StyledJsonViewer>
    );
};
