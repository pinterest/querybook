import React from 'react';
import { Title } from 'ui/Title/Title';

interface IProps {
    title: React.ReactNode;
}
export const DataTableViewOverviewSection: React.FC<IProps> = ({
    title,
    children,
}) =>
    children ? (
        <div>
            <div className="overview-section-top mb12">
                <Title size={5}>{title}</Title>
            </div>
            <div className="overview-section-content">{children}</div>
            <br />
        </div>
    ) : null;
