import React, { useContext, useMemo } from 'react';

import { useToggleState } from 'hooks/useToggleState';
import { PythonContext } from 'lib/python/python-provider';
import { PythonKernelStatus } from 'lib/python/types';
import { Markdown } from 'ui/Markdown/Markdown';
import { Modal } from 'ui/Modal/Modal';
import { AccentText } from 'ui/StyledText/StyledText';

import { PythonLogo } from './PythonLogo';

import './PythonKernelButton.scss';

const PythonGuide = require('./guide.md');

export const PythonKernelButton = () => {
    const { status } = useContext(PythonContext);
    const [showModal, , toggleShowModal] = useToggleState(false);

    const borderColor = useMemo(() => {
        switch (status) {
            case PythonKernelStatus.UNINITIALIZED:
                return 'var(--color-null)';
            case PythonKernelStatus.INITIALIZING:
                return 'var(--color-yellow)';
            case PythonKernelStatus.IDLE:
                return 'var(--color-true)';
            case PythonKernelStatus.FAILED:
                return 'var(--color-false)';
        }
    }, [status]);

    return (
        <>
            <div
                aria-label={`Python kernel: ${status}`}
                data-balloon-pos="left"
                className="PythonKernelButton"
                style={{
                    borderColor,
                }}
                onClick={toggleShowModal}
            >
                <PythonLogo size={20} />
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
