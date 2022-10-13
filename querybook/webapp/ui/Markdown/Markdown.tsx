import MarkdownJSX, { MarkdownToJSX } from 'markdown-to-jsx';
import React from 'react';

import { Content } from 'ui/Content/Content';
import { Link } from 'ui/Link/Link';
import { Message } from 'ui/Message/Message';

const MarkdownCode = React.lazy(() => import('./MarkdownCode'));

const MarkdownLink: React.FC<{ title: string; href: string }> = ({
    title,
    href,
    children,
}) => (
    <Link to={href} title={title} newTab naturalLink>
        {children}
    </Link>
);

// from: https://stackoverflow.com/questions/65807962/how-to-apply-code-highlights-within-markdown-to-jsx-package-in-react
const PreBlock: React.FC<
    React.HTMLAttributes<HTMLPreElement> & { children: React.ReactChildren }
> = ({ children, ...rest }) => {
    if ('type' in children && children['type'] === 'code') {
        return <MarkdownCode {...children['props']} />;
    }
    return <pre {...rest}>{children}</pre>;
};

const markdownOptions: MarkdownToJSX.Options = {
    overrides: {
        a: {
            component: MarkdownLink,
        },
        Message: { component: Message },
        pre: PreBlock,
    },
};

export const Markdown: React.FC<{ children: string }> = ({ children }) => (
    <Content>
        <MarkdownJSX options={markdownOptions}>{children}</MarkdownJSX>
    </Content>
);
