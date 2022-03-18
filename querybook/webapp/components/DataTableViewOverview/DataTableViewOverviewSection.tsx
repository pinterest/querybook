import React from 'react';
import { AccentText } from 'ui/StyledText/StyledText';

interface IProps {
    title: React.ReactNode;
}
export const DataTableViewOverviewSection: React.FC<IProps> = ({
    title,
    children,
}) =>
    children ? (
        <div className="mb36">
            <AccentText className="mb12" size="med" color="text" weight="bold">
                {title}
            </AccentText>
            <div className="overview-section-content">{children}</div>
        </div>
    ) : null;
