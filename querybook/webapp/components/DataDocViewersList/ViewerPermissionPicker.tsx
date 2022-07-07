import React from 'react';

import { Permission, IViewerInfo } from 'lib/data-doc/datadoc-permission';
import { sendConfirm } from 'lib/querybookUI';
import { Icon } from 'ui/Icon/Icon';
import { Menu, MenuDivider, MenuItem } from 'ui/Menu/Menu';
import { Popover } from 'ui/Popover/Popover';
import { AccentText } from 'ui/StyledText/StyledText';

interface IProp {
    viewerInfo: IViewerInfo;
    readonly?: boolean;
    publicDataDoc: boolean;
    isOwner: boolean;

    onPermissionChange: (permision: Permission) => any;
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
                        onClick={() => onPermissionChange(Permission.CAN_READ)}
                    >
                        read only
                    </MenuItem>
                )}
                <MenuItem
                    onClick={() => onPermissionChange(Permission.CAN_WRITE)}
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
                                    onPermissionChange(Permission.OWNER),
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
        viewerInfo.permission === Permission.CAN_READ ||
        viewerInfo.permission === Permission.CAN_WRITE;

    const pickerButton =
        canShowEditMenu && !readonly ? (
            <div
                className="permission-text flex-row mr8"
                onClick={() => setShowEditMenu(true)}
            >
                <AccentText noUserSelect cursor="pointer" weight="bold">
                    {viewerInfo.permission}
                </AccentText>
                <Icon className="ml8" name="ChevronDown" size={16} />
            </div>
        ) : (
            <AccentText noUserSelect cursor="default" weight="bold">
                {viewerInfo.permission}
            </AccentText>
        );

    return (
        <div className="ViewerPermissionPicker" ref={selfRef}>
            {pickerButton}
            {editMenuDOM}
        </div>
    );
};
