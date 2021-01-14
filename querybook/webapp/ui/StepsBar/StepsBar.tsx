import React from 'react';

import './StepsBar.scss';

interface IProps {
    steps: React.ReactChild[];
    activeStep: number;
}

export const StepsBar: React.FunctionComponent<IProps> = ({
    steps, // Array of strings
    activeStep, // Everything <= activeStep index is active
}) => {
    const widthPerStep = `${(1 / steps.length) * 100}%`;
    const stepsDOM = steps.map((step, index) => (
        <li
            key={index}
            className={index <= activeStep ? 'StepsBar-active' : ''}
            style={{ width: widthPerStep }}
        >
            {step}
        </li>
    ));

    return (
        <div className="StepsBar">
            <ul className="StepsBar-ul">{stepsDOM}</ul>
        </div>
    );
};
