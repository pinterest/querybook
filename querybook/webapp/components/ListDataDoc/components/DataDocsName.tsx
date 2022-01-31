import React from 'react';
import styled from 'styled-components';

const UntitledText = styled.span`
    opacity: 0.7;
    font-style: italic;
`;

const Link = styled.a`
  text-align: left;
  display: block;
`;

export const DataDocsName: React.FunctionComponent<{
    data: { title: string; id: number };
    env: { name: string }
}> = ({ data, env }) => {
    return (
        <Link href={`/${env.name}/datadoc/${data.id}/`} title={data.title}>
            {data.title ? data.title : <UntitledText>Untitled</UntitledText>}
        </Link>
    );
};
