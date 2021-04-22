import React from 'react';
import { DataDocPermission } from 'lib/data-doc/datadoc-permission';
import { Popover } from 'ui/Popover/Popover';
import { MenuItem, Menu } from 'ui/Menu/Menu';
import { IconButton } from 'ui/Button/IconButton';
import './DataDocAccessRequestPermissionPicker.scss';

interface IPermissionPickerProp {
    uid: number;
    addDataDocEditor?: (uid: number, permission: DataDocPermission) => any;
    rejectDataDocAccessRequest?: (uid: number) => any;
    addQueryExecutionViewer?: (uid: number) => any;
    rejectQueryExecutionAccessRequest?: (uid: number) => any;
}

export const DataDocAccessRequestPermissionPicker: React.FunctionComponent<IPermissionPickerProp> = ({
    uid,
    addDataDocEditor,
    rejectDataDocAccessRequest,
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
            layout={['bottom', 'left']}
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
            className="permission-text flex-row mr8"
            onClick={() => setShowEditMenu(true)}
        >
            <i className="fa fa-caret-down caret-icon" />
            <span> {permission}</span>
        </div>
    );
    const accessRequestControlButtonsDOM = (
        <div className="access-request-control-buttons flex-row">
            <IconButton
                className="access-request-control-button"
                icon="check-circle"
                onClick={() => addDataDocEditor(uid, permission)}
                tooltip={`Allow ${permission} permission`}
                tooltipPos="left"
            />
            <IconButton
                className="access-request-control-button"
                icon="x-circle"
                onClick={() => rejectDataDocAccessRequest(uid)}
            />
        </div>
    );

    return (
        <div
            className="DataDocAccessRequestPermissionPicker flex-row"
            ref={selfRef}
        >
            {pickerButton}
            {accessRequestControlButtonsDOM}
            {editMenuDOM}
        </div>
    );
};
