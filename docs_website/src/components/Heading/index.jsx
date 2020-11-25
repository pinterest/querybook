import React from 'react';
import './index.scss';

export default ({ headingKey, title, subtitle }) => (
    <div className="Heading">
        {headingKey && <div className="Heading-key">{headingKey}</div>}
        {title && <div className="Heading-title">{title}</div>}
        {subtitle && <div className="Heading-subtitle">{subtitle}</div>}
    </div>
);
