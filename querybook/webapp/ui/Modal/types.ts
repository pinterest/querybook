import React from 'react';

interface IBaseModalProps {
    hideModalTitle?: boolean;
    className?: string;

    // defaults to '', set to null to hide title
    title?: string;
    topDOM?: React.ReactElement;
    bottomDOM?: React.ReactElement;
}

export interface ICustomModalProps extends IBaseModalProps {
    type: 'custom';
    onHide?: any;
}

export interface IStandardModalProps extends IBaseModalProps {
    type?: 'fullscreen' | 'standard';
    onHide: () => any;
}

export type IModalProps = ICustomModalProps | IStandardModalProps;
