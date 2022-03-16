import React from 'react';
import styled from 'styled-components';
import { Link } from 'ui/Link/Link';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { Icon } from 'ui/Icon/Icon';

const UntitledText = styled.span`
    opacity: 0.7;
    font-style: italic;
`;

const StyledLink = styled(Link)`
    text-align: left;
    display: block;
`;

export const DataDocName: React.FunctionComponent<{
    data: { title: string; id: number };
}> = ({ data }) => (
    <StyledLink to={getWithinEnvUrl(`/datadoc/${data.id}/`)}>
        <span className="flex-row">
            {data.title ? data.title : <UntitledText>Untitled</UntitledText>}
            <Icon name="external-link" className="ml4" size={14} />
        </span>
    </StyledLink>
);
