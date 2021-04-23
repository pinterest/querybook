import clsx from 'clsx';
import React from 'react';

import { Button } from 'ui/Button/Button';

import './Pagination.scss';

interface IPageButtonProps {
    page: number;
    onClick: (page: number) => any;
    shift?: number;
    className?: string;
}
const PageButton: React.FunctionComponent<IPageButtonProps> = ({
    page,
    onClick,
    shift = 0,
    className = '',
}) => (
    <li>
        <Button
            className={'Pagination-page-button ' + className}
            onClick={onClick.bind(null, page)}
            title={(page + shift).toString()}
        />
    </li>
);

export interface IPaginationProps {
    currentPage: number;
    totalPage: number;
    onPageClick: (page: number) => any;

    className?: string;
    shift?: number;
    padding?: number;
    hideNavButton?: boolean;
}
export const Pagination: React.FunctionComponent<IPaginationProps> = ({
    currentPage,
    totalPage,

    onPageClick,

    className = '',
    shift = 1, // you can pass in 0, we can shift it to 1
    padding = 2, // number of page on the left and right of current page
    hideNavButton = false,
}) => {
    const paginationListDOM: React.ReactNode[] = [];

    const pageRanges: number[] = [];
    for (
        let i = Math.max(currentPage - padding, 0);
        i >= 0 && i < Math.min(totalPage, currentPage + padding + 1);
        i++
    ) {
        pageRanges.push(i);
    }

    if (pageRanges[0] > 0) {
        paginationListDOM.push(
            <PageButton page={0} key={0} onClick={onPageClick} shift={shift} />
        );
        if (pageRanges[0] > 1) {
            paginationListDOM.push(
                <li key="first">
                    <span className="Pagination-ellipsis">&hellip;</span>
                </li>
            );
        }
    }

    pageRanges.forEach((page) => {
        paginationListDOM.push(
            <PageButton
                key={page}
                page={page}
                onClick={onPageClick}
                shift={shift}
                className={page === currentPage ? 'current' : ''}
            />
        );
    });

    if (pageRanges[pageRanges.length - 1] < totalPage - 1) {
        if (pageRanges[pageRanges.length - 1] < totalPage - 2) {
            paginationListDOM.push(
                <li key="last">
                    <span className="Pagination-ellipsis">&hellip;</span>
                </li>
            );
        }
        paginationListDOM.push(
            <PageButton
                key={totalPage - 1}
                page={totalPage - 1}
                onClick={onPageClick}
                shift={shift}
            />
        );
    }

    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage === totalPage - 1;

    const previousButton = (
        <div key="previous-div" className="Pagination-previous">
            {isFirstPage ? null : (
                <Button
                    title="Previous"
                    onClick={onPageClick.bind(null, currentPage - 1)}
                />
            )}
        </div>
    );

    const nextButton = (
        <div key="next-div" className="Pagination-next">
            {isLastPage || totalPage === 0 ? null : (
                <Button
                    title="Next"
                    onClick={onPageClick.bind(null, currentPage + 1)}
                />
            )}
        </div>
    );

    const navButtons = !hideNavButton ? [previousButton, nextButton] : null;

    return (
        <nav
            className={clsx({
                Pagination: true,
                [className]: Boolean(className),
            })}
        >
            {navButtons}
            <ul className="Pagination-pages flex-center">
                {paginationListDOM}
            </ul>
        </nav>
    );
};
