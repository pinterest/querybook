import React, { useMemo } from 'react';

function arrayToChunk(arr, chunkSize) {
    return arr.reduce((chunks, item, itemIdx) => {
        const chunkIndex = Math.floor(itemIdx / chunkSize);
        while (chunks.length <= chunkIndex) {
            chunks.push([]);
        }
        chunks[chunkIndex].push(item);
        return chunks;
    }, []);
}

const cellClassName = {
    1: '',
    2: 'col--6',
    3: 'col--4',
    4: 'col--3',
    6: 'col--2',
};

export default ({
    renderer, // (item: T) => React.ReactNode
    items = [], // T[]
    itemPerRow = 3, // number
    className = '',
    itemClassName = '',
}) => {
    const itemChunks = useMemo(() => arrayToChunk(items, itemPerRow), [
        items,
        itemPerRow,
    ]);
    const colClassName = `col ${cellClassName[itemPerRow]}`;
    const rowsDOM = itemChunks.map((chunk, chunkIdx) => {
        const itemsDOM = chunk.map((item, itemIdx) => (
            <div className={colClassName + ' ' + itemClassName} key={itemIdx}>
                {renderer(item)}
            </div>
        ));
        return (
            <div className="row" key={chunkIdx}>
                {itemsDOM}
            </div>
        );
    });

    return <div className={`container Grid ${className}`}>{rowsDOM}</div>;
};
