import React from 'react';
import styled from 'styled-components';
import { Link } from 'ui/Link/Link';
import { getWithinEnvUrl } from 'lib/utils/query-string';

const DocTitle = styled.span`
    font-weight: bold;
    font-size: var(--med-text-size);
    ${(props) =>
        props.untitled &&
        `
    opacity: 0.7;
    font-style: italic;
    `}
`;

const StyledLink = styled(Link)`
    text-align: left;
    display: block;
`;

export const DataDocName: React.FunctionComponent<{
    data: { title: string; id: number };
}> = ({ data }) => (
    <StyledLink to={getWithinEnvUrl(`/datadoc/${data.id}/`)}>
        <DocTitle untitled={!data.title}>
            {data.title ? data.title : 'Untitled'}
        </DocTitle>
    </StyledLink>
);
