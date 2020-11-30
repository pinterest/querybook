import React from 'react';
import './InputField.scss';

export default ({ value, onChange, placeholder = '' }) => {
    return (
        <div className="InputField">
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
};
