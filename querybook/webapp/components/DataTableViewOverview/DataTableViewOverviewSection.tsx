import React from 'react';
import { Title } from 'ui/Title/Title';
import { Divider } from 'ui/Divider/Divider';

interface IProps {
    title: React.ReactNode;
}
export const DataTableViewOverviewSection: React.FC<IProps> = ({
    title,
    children,
}) =>
    children ? (
        <div>
            <div className="overview-section-top">
                <Title size={5}>{title}</Title>
                <Divider marginTop="4px" marginBottom="12px" />
            </div>
            <div className="overview-section-content">{children}</div>
            <br />
        </div>
    ) : null;
