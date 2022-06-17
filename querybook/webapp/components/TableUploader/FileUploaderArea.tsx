import React, { useCallback, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import styled from 'styled-components';

import { Button } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { Icon } from 'ui/Icon/Icon';
import { StyledText } from 'ui/StyledText/StyledText';

import { IDragObjectFiles } from './types';

interface IFileUploaderAreaProps {
    onUpload: (f?: File) => void;
    file?: File;
}

const StyledDropArea = styled.div<{ isActive: boolean }>`
    background-color: ${(props) =>
        props.isActive ? 'var(--bg-hover)' : 'var(--bg-lightest)'};
    height: 300px;
    width: 500px;
    text-align: center;
    border-radius: var(--border-radius);
    padding: var(--padding);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

// Mime type -> readable name
const AllowedMimeTypesDict = {
    'text/csv': 'csv',
    'text/tab-separated-values': 'tsv',
    'text/plain': 'txt',
};
const AllowedFileTypes = Object.values(AllowedMimeTypesDict).join(', ');
const AllowedMimeTypes = Object.keys(AllowedMimeTypesDict).join(',');

export const FileUploaderArea: React.FC<IFileUploaderAreaProps> = ({
    onUpload,
    file: selectedFile,
}) => {
    const noDropReasonRef = React.useRef('');

    const [{ canDrop, isOver, noDropReason }, dropRef] = useDrop<
        IDragObjectFiles,
        unknown,
        {
            isOver: boolean;
            canDrop: boolean;
            noDropReason: string;
        }
    >({
        accept: NativeTypes.FILE,
        drop: (fileDropped) => {
            const file = fileDropped.items[0].getAsFile();
            onUpload(file);
        },
        canDrop: (fileToBeDropped) => {
            let rejectReason = '';

            // Not sure why but sometimes items is empty or files is empty
            // So we just check whichever one that is not empty
            if (fileToBeDropped.items.length > 1) {
                rejectReason = 'Cannot drop multiple files';
            } else if (
                fileToBeDropped.items.length > 0 &&
                !(fileToBeDropped.items[0].type in AllowedMimeTypesDict)
            ) {
                rejectReason = `Allowed types: ${AllowedFileTypes}`;
            }

            noDropReasonRef.current = rejectReason;

            return rejectReason === '';
        },
        collect: (monitor) => {
            const canDrop = monitor.canDrop();
            return {
                isOver: monitor.isOver(),
                canDrop,
                noDropReason: canDrop ? '' : noDropReasonRef.current,
            };
        },
    });

    let innerMessageDOM: React.ReactNode;
    let uploadedFileDOM: React.ReactNode;
    if (!isOver) {
        innerMessageDOM = (
            <div>
                <div className="mb8">
                    <StyledText untitled>
                        Drag a file here to upload (Allowed types:{' '}
                        {AllowedFileTypes})
                    </StyledText>
                </div>

                <FileUploaderButton onUpload={onUpload} />
            </div>
        );
        uploadedFileDOM = selectedFile && (
            <div className="mt4 flex-row">
                <div className="flex-row">
                    <Icon name="File" className="mr4" size="16" />
                    <StyledText>{selectedFile.name}</StyledText>
                </div>

                <IconButton icon="X" onClick={() => onUpload(null)} />
            </div>
        );
    } else {
        if (canDrop) {
            innerMessageDOM = <StyledText>Release to upload</StyledText>;
        } else {
            innerMessageDOM = (
                <StyledText>Not allowed to drop: {noDropReason}</StyledText>
            );
        }
    }

    return (
        <StyledDropArea ref={dropRef} isActive={isOver && canDrop}>
            {innerMessageDOM}
            {uploadedFileDOM}
        </StyledDropArea>
    );
};

const FileUploaderButton: React.FC<{ onUpload: (f: File) => void }> = ({
    onUpload,
}) => {
    const hiddenInputRef = useRef<HTMLInputElement>();
    const handleButtonClick = useCallback(() => {
        hiddenInputRef.current.click();
    }, []);
    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onUpload(e.target.files[0]);
        },
        [onUpload]
    );

    return (
        <>
            <Button
                title="Click to Upload"
                icon="Upload"
                onClick={handleButtonClick}
            />
            <input
                ref={hiddenInputRef}
                style={{ display: 'none' }}
                type="file"
                onChange={handleFileInputChange}
                accept={AllowedMimeTypes}
            />
        </>
    );
};
