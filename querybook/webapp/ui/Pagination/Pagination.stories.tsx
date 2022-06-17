import centered from '@storybook/addon-centered/react';
import React from 'react';

import { Pagination } from './Pagination';

export const _Pagination = (args) => {
    const [currentPage, setCurrentPage] = React.useState(0);

    return (
        <Pagination
            {...args}
            currentPage={currentPage}
            onPageClick={(page) => setCurrentPage(page)}
        />
    );
};

_Pagination.args = {
    shift: 1,
    padding: 2,
    hideNavButton: false,
    totalPage: 100,
};

export default {
    title: 'Stateful/Pagination',
    decorators: [centered],
};
