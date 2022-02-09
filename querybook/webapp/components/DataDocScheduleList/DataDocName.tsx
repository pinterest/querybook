import React from 'react';
import styled from 'styled-components';
import { Link } from 'ui/Link/Link';
import { IEnvironment } from 'redux/environment/types';

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
    environment: IEnvironment;
}> = ({ data, environment }) => {
    return (
        <StyledLink to={`/${environment.name}/datadoc/${data.id}/`}>
            {data.title ? data.title : <UntitledText>Untitled</UntitledText>}
        </StyledLink>
    );
};
