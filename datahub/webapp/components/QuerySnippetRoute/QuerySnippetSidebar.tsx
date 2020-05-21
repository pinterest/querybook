import React from 'react';
import styled from 'styled-components';

import { QuerySnippetNavigator } from 'components/QuerySnippetNavigator/QuerySnippetNavigator';
import history from 'lib/router-history';

import { Sidebar } from 'ui/Sidebar/Sidebar';
import { FullHeight } from 'ui/FullHeight/FullHeight';

const QuerySnippetSidebarHeader = styled.div`
    margin-bottom: 20px;
`;

const QuerySnippetSidebarHeaderTop = styled.div`
    display: flex;
`;

const DataHubLogo = styled.div`
    padding-top: 4px;
    font-size: 1.1em;
`;

interface IQuerySnippetSidebarSectionProps {
    seamless?: boolean;
    wide?: boolean;
}
const QuerySnippetSidebarSection = styled.div`
    padding: 0px 10px;

    & + & {
        padding-top: 10px;
    }

    ${({ seamless }) =>
        !seamless &&
        `
        padding-top: 10px;
    `} ${({ wide }) =>
        wide &&
        `
        padding-left: 0px;
        padding-right: 0px;
    `};
`;

const QuerySnippetSidebarContent = styled.div`
    flex: 1;
    overflow: hidden;

    .QuerySnippetNavigator {
        height: 100%;
    }
`;

export const QuerySnippetSidebar: React.FunctionComponent = () => {
    const sidebarHeaderDOM = (
        <>
            <QuerySnippetSidebarSection>
                <QuerySnippetSidebarHeaderTop>
                    <DataHubLogo>
                        <i className="fas fa-table mr4" />
                        Snippets
                    </DataHubLogo>
                </QuerySnippetSidebarHeaderTop>
            </QuerySnippetSidebarSection>
        </>
    );

    return (
        <Sidebar className={'QuerySnippetSidebar'} initialWidth={280} left>
            <FullHeight flex="column">
                <QuerySnippetSidebarHeader>
                    {sidebarHeaderDOM}
                </QuerySnippetSidebarHeader>
                <QuerySnippetSidebarContent>
                    <QuerySnippetNavigator
                        onQuerySnippetSelect={({ id }) =>
                            history.push(`/template/${id}/`)
                        }
                    />
                </QuerySnippetSidebarContent>
            </FullHeight>
        </Sidebar>
    );
};
