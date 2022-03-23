import * as React from 'react';

import { useToggleState } from 'hooks/useToggleState';
import { SoftButton } from 'ui/Button/Button';
import { TemplateGuideModal } from 'components/TemplateGuide/TemplateGuide';
import { IconButton } from 'ui/Button/IconButton';

export const DataDocTemplateInfoButton: React.FunctionComponent<{
    title?: string;
    style?: 'button' | 'icon';
}> = ({ title, style = 'button' }) => {
    const [showModal, , toggleShowModal] = useToggleState(false);

    const buttonDOM =
        style === 'icon' ? (
            <IconButton
                icon="Info"
                onClick={toggleShowModal}
                tooltip={title ?? 'Templating Guide'}
                size={18}
                invertCircle
            />
        ) : (
            <SoftButton
                icon="Info"
                title={title ?? 'Templating Guide'}
                onClick={toggleShowModal}
            />
        );

    return (
        <>
            {buttonDOM}
            {showModal && <TemplateGuideModal onHide={toggleShowModal} />}
        </>
    );
};
