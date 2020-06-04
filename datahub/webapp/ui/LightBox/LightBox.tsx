import * as classNames from 'classnames';
import React from 'react';

import { useAppBlur } from 'hooks/ui/useAppBlur';

import { IconButton } from 'ui/Button/IconButton';
import { Modal } from 'ui/Modal/Modal';

import './LightBox.scss';

export const LightBox: React.FunctionComponent<{
    onHide?: () => any;
    className?: string;
}> = ({ className, onHide, children }) => {
    useAppBlur();

    const lightBoxClassName = classNames({
        LightBox: true,
        'flex-center': true,
        fullscreen: true,
        [className]: Boolean(className),
    });

    const closeButton = (
        <IconButton
            className="Modal-close"
            aria-label="close"
            icon="x"
            onClick={onHide}
        />
    );

    return (
        <Modal type="custom" hideClose>
            <div className={lightBoxClassName} onClick={onHide}>
                {closeButton}
                <div className="LightBox-box">{children}</div>
            </div>
        </Modal>
    );
};
