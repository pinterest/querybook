import React from 'react';
import './AccessRequestPermissionPicker.scss';
import { DataDocPermission } from 'lib/data-doc/datadoc-permission';
import { Popover } from 'ui/Popover/Popover';
import { MenuItem, Menu } from 'ui/Menu/Menu';
import { Button } from 'ui/Button/Button';

interface IPermissionPickerProp {
    uid: number;
    approveDataDocAccessRequest: (
        uid: number,
        permission: DataDocPermission
    ) => any;
}

export const AccessRequestPermissionPicker: React.FunctionComponent<IPermissionPickerProp> = ({
    uid,
    approveDataDocAccessRequest,
}) => {
    const [showEditMenu, setShowEditMenu] = React.useState(false);
    const selfRef = React.useRef<HTMLDivElement>(null);
    const [permission, setPermission] = React.useState(
        DataDocPermission.CAN_READ
    );
    const editMenuDOM = showEditMenu && (
        <Popover
            onHide={() => setShowEditMenu(false)}
            anchor={selfRef.current}
            layout={['bottom', 'right']}
            hideArrow
        >
            <Menu>
                <MenuItem
                    onClick={() => setPermission(DataDocPermission.CAN_READ)}
                >
                    read only
                </MenuItem>
                <MenuItem
                    onClick={() => setPermission(DataDocPermission.CAN_WRITE)}
                >
                    edit
                </MenuItem>
            </Menu>
        </Popover>
    );
    const pickerButton = (
        <div
            className="permission-text flex-row"
            onClick={() => setShowEditMenu(true)}
        >
            <i className="fa fa-caret-down caret-icon" />
            <span> {permission}</span>
        </div>
    );

    const approveRequestButton = (
        <Button
            title="Approve"
            small
            onClick={() => {
                approveDataDocAccessRequest(uid, permission);
            }}
        />
    );

    return (
        <div className="AccessRequestPermissionPicker" ref={selfRef}>
            {approveRequestButton}
            {pickerButton}
            {editMenuDOM}
        </div>
    );
};
