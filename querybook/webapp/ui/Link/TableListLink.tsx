import * as React from 'react';

import { StyledText } from 'ui/StyledText/StyledText';
import { ILinkProps } from './Link';
import { TableLink } from './TableLink';

import './ListLink.scss';

interface IProps extends ILinkProps {
    title: string;
    schema: string;
    onClick: (to: React.MouseEvent) => any;
}

export const TableListLink: React.FunctionComponent<IProps> = React.memo(
    ({ title, children, schema, onClick }) => {
        return (
            <TableLink fullDBName={`${schema}.${title}`} onClick={onClick}>
                <StyledText className="ListLinkText" size="small">
                    {title}
                </StyledText>

                {children}
            </TableLink>
        );
    }
);
