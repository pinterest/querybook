import React from 'react';
import './ViewerPermissionPicker.scss';

import {
    DataDocPermission,
    IViewerInfo,
} from 'lib/data-doc/datadoc-permission';
import { Popover } from 'ui/Popover/Popover';
import { MenuItem, MenuDivider, Menu } from 'ui/Menu/Menu';
import { sendConfirm } from 'lib/querybookUI';
import { Icon } from 'ui/Icon/Icon';

interface IProp {
    viewerInfo: IViewerInfo;
    readonly?: boolean;
    publicDataDoc: boolean;
    isOwner: boolean;

    onPermissionChange: (permision: DataDocPermission) => any;
    onRemoveEditor?: (uid: number) => any;
}

export const ViewerPermissionPicker: React.FunctionComponent<IProp> = ({
    readonly = false,
    publicDataDoc,
    viewerInfo,
    onPermissionChange,
    onRemoveEditor,
    isOwner,
}) => {
    const [showEditMenu, setShowEditMenu] = React.useState(false);
    const selfRef = React.useRef<HTMLDivElement>(null);
    const editMenuDOM = showEditMenu && (
        <Popover
            onHide={() => setShowEditMenu(false)}
            anchor={selfRef.current}
            layout={['bottom', 'right']}
            hideArrow
            noPadding
        >
            <Menu>
                {!publicDataDoc && (
                    <MenuItem
                        onClick={() =>
                            onPermissionChange(DataDocPermission.CAN_READ)
                        }
                    >
                        read only
                    </MenuItem>
                )}
                <MenuItem
                    onClick={() =>
                        onPermissionChange(DataDocPermission.CAN_WRITE)
                    }
                >
                    edit
                </MenuItem>
                {isOwner && (
                    <MenuItem
                        onClick={() =>
                            sendConfirm({
                                header: 'Transfer Ownership',
                                message:
                                    'Are you sure you want to transfer ownership?',
                                onConfirm: () =>
                                    onPermissionChange(DataDocPermission.OWNER),
                            })
                        }
                    >
                        owner
                    </MenuItem>
                )}
                {onRemoveEditor && (
                    <>
                        <MenuDivider />
                        <MenuItem
                            onClick={() => onRemoveEditor(viewerInfo.uid)}
                        >
                            remove
                        </MenuItem>
                    </>
                )}
            </Menu>
        </Popover>
    );

    const canShowEditMenu =
        viewerInfo.permission === DataDocPermission.CAN_READ ||
        viewerInfo.permission === DataDocPermission.CAN_WRITE;

    const pickerButton =
        canShowEditMenu && !readonly ? (
            <div
                className="permission-text flex-row"
                onClick={() => setShowEditMenu(true)}
            >
                <span>{viewerInfo.permission}</span>
                <Icon className="ml8" name="chevron-down" size={16} />
            </div>
        ) : (
            <div className="permission-text flex-row">
                {viewerInfo.permission}
            </div>
        );

    return (
        <div className="ViewerPermissionPicker" ref={selfRef}>
            {pickerButton}
            {editMenuDOM}
        </div>
    );
};
