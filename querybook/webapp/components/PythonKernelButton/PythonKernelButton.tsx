import PythonLogoSvg from './python-logo.svg';
import React, { useContext } from 'react';

import { useToggleState } from 'hooks/useToggleState';
import { PythonContext } from 'lib/python/python-provider';
import { PythonKernelStatus } from 'lib/python/types';
import { Markdown } from 'ui/Markdown/Markdown';
import { Modal } from 'ui/Modal/Modal';
import { AccentText } from 'ui/StyledText/StyledText';

import './PythonKernelButton.scss';

const PythonGuide = require('./guide.md');

const BORDER_COLORS = {
    [PythonKernelStatus.UNINITIALIZED]: 'var(--color-null)',
    [PythonKernelStatus.INITIALIZING]: 'var(--color-yellow)',
    [PythonKernelStatus.IDLE]: 'var(--color-true)',
    [PythonKernelStatus.FAILED]: 'var(--color-false)',
};

export const PythonKernelButton = () => {
    const { kernelStatus } = useContext(PythonContext);
    const [showModal, , toggleShowModal] = useToggleState(false);

    return (
        <>
            <div
                aria-label={`Python kernel: ${kernelStatus}`}
                data-balloon-pos="left"
                className="PythonKernelButton"
                style={{
                    borderColor: BORDER_COLORS[kernelStatus],
                }}
                onClick={toggleShowModal}
            >
                <PythonLogoSvg width={20} height={20} />
                <AccentText
                    className="icon-title"
                    size="xxxsmall"
                    weight="light"
                >
                    Python
                </AccentText>
            </div>
            {showModal && (
                <Modal onHide={toggleShowModal} title={'Python Cell Guide'}>
                    <Markdown>{PythonGuide}</Markdown>
                </Modal>
            )}
        </>
    );
};
