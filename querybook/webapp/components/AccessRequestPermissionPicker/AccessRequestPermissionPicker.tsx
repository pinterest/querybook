import React from 'react';

import { Permission } from 'lib/data-doc/datadoc-permission';

import { IconButton } from 'ui/Button/IconButton';
import { Icon } from 'ui/Icon/Icon';
import { Menu, MenuItem } from 'ui/Menu/Menu';
import { Popover } from 'ui/Popover/Popover';
import { AccentText } from 'ui/StyledText/StyledText';

import './AccessRequestPermissionPicker.scss';

interface IPermissionPickerProp {
    uid: number;
    addEditor?: (uid: number, permission: Permission) => any;
    rejectAccessRequest?: (uid: number) => any;
    addQueryExecutionViewer?: (uid: number) => any;
    rejectQueryExecutionAccessRequest?: (uid: number) => any;
}

export const AccessRequestPermissionPicker: React.FunctionComponent<
    IPermissionPickerProp
> = ({ uid, addEditor, rejectAccessRequest }) => {
    const [showEditMenu, setShowEditMenu] = React.useState(false);
    const selfRef = React.useRef<HTMLDivElement>(null);
    const [permission, setPermission] = React.useState(Permission.CAN_READ);
    const editMenuDOM = showEditMenu && (
        <Popover
            onHide={() => setShowEditMenu(false)}
            anchor={selfRef.current}
            layout={['bottom', 'left']}
            hideArrow
            noPadding
        >
            <Menu>
                <MenuItem onClick={() => setPermission(Permission.CAN_READ)}>
                    read only
                </MenuItem>
                <MenuItem onClick={() => setPermission(Permission.CAN_WRITE)}>
                    edit
                </MenuItem>
            </Menu>
        </Popover>
    );
    const pickerButton = (
        <div
            className="permission-text flex-row mr8"
            onClick={() => setShowEditMenu(true)}
        >
            <AccentText>{permission}</AccentText>
            <Icon name="ChevronDown" className="ml4" size={16} />
        </div>
    );
    const accessRequestControlButtonsDOM = (
        <div className="access-request-control-buttons flex-row">
            <IconButton
                className="access-request-control-button"
                icon="CheckCircle"
                onClick={() => addEditor(uid, permission)}
                tooltip={`Allow ${permission} permission`}
                tooltipPos="left"
            />
            <IconButton
                className="access-request-control-button"
                icon="XCircle"
                onClick={() => rejectAccessRequest(uid)}
                tooltip="Reject access request"
                tooltipPos="left"
            />
        </div>
    );

    return (
        <div className="AccessRequestPermissionPicker flex-row" ref={selfRef}>
            {pickerButton}
            {accessRequestControlButtonsDOM}
            {editMenuDOM}
        </div>
    );
};
