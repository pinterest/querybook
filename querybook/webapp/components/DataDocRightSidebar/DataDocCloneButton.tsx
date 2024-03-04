import React, { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';

import { ComponentType, ElementType } from 'const/analytics';
import { trackClick } from 'lib/analytics';
import { sendConfirm } from 'lib/querybookUI';
import history from 'lib/router-history';
import * as dataDocActions from 'redux/dataDoc/action';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { IEnvironment } from 'redux/environment/types';
import { Dispatch } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';

import { DataDocCloneButtonConfirm } from './DataDocCloneButtonConfirm';

interface IProps {
    docId: number;
}

export const DataDocCloneButton: React.FunctionComponent<IProps> = ({
    docId,
}) => {
    const dispatch: Dispatch = useDispatch();
    const currentEnvironment = useSelector(currentEnvironmentSelector);
    const selectedEnvironment = useRef<IEnvironment>(currentEnvironment);

    const onClone = useCallback(() => {
        sendConfirm({
            header: 'Clone DataDoc?',
            message: (
                <DataDocCloneButtonConfirm
                    defaultEnvironment={currentEnvironment}
                    onEnvironmentChange={(environment) => {
                        selectedEnvironment.current = environment;
                    }}
                />
            ),
            onConfirm: () => {
                trackClick({
                    component: ComponentType.DATADOC_PAGE,
                    element: ElementType.CLONE_DATADOC_BUTTON,
                });
                toast.promise(
                    dispatch(
                        dataDocActions.cloneDataDoc(
                            docId,
                            selectedEnvironment.current.id
                        )
                    ).then((dataDoc) =>
                        history.push(
                            `/${selectedEnvironment.current.name}/datadoc/${dataDoc.id}/`
                        )
                    ),
                    {
                        loading: 'Cloning DataDoc...',
                        success: 'Clone Success!',
                        error: 'Cloning failed.',
                    }
                );
            },
            cancelColor: 'default',
            confirmIcon: 'Copy',
        });
    }, [currentEnvironment, dispatch, docId]);

    return (
        <IconButton
            icon="Copy"
            onClick={onClone}
            tooltip={'Clone'}
            tooltipPos={'left'}
            title="Clone"
        />
    );
};
