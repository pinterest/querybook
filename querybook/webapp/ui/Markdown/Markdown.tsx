import MarkdownJSX, { MarkdownToJSX } from 'markdown-to-jsx';
import React from 'react';

import { Content } from 'ui/Content/Content';
import { Link } from 'ui/Link/Link';

const MarkdownLink: React.FC<{ title: string; href: string }> = ({
    title,
    href,
    children,
}) => (
    <Link to={href} title={title} newTab naturalLink>
        {children}
    </Link>
);

const markdownOptions: MarkdownToJSX.Options = {
    overrides: {
        a: {
            component: MarkdownLink,
        },
    },
};

export const Markdown: React.FC<{ children: string }> = ({ children }) => (
    <Content>
        <MarkdownJSX options={markdownOptions}>{children}</MarkdownJSX>
    </Content>
);
