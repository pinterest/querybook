import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { IStoreState } from 'redux/store/types';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { IBoard } from 'const/board';
import { IOption } from 'lib/utils/react-select';
import { OptionTypeBase } from 'react-select';

export interface IDataDocBoardsSelectProps {
    onChange: (params: OptionTypeBase[]) => void;
    value: IOption<number>[];
    label?: string;
    name: string;
}

export const DataDocBoardsSelect: React.FC<IDataDocBoardsSelectProps> = ({
    onChange,
    value,
    label,
    name,
}) => {
    const boardById: Record<string, IBoard> = useSelector(
        (state: IStoreState) => state.board.boardById
    );

    const boardOptions: IOption<number>[] = useMemo(() => {
        return Object.values(boardById).map((board) => ({
            value: board.id,
            label: board.name,
        }));
    }, [boardById]);

    const selectedBoards: IOption<number>[] = useMemo(
        () =>
            boardOptions.filter((board) =>
                value.map((v) => v.value).includes(board.value)
            ),
        []
    );

    return (
        <SimpleField
            label={label}
            name={name}
            value={value}
            defaultValue={selectedBoards}
            options={boardOptions}
            onChange={onChange}
            optionSelector={(v: IOption<number>) => v}
            closeMenuOnSelect={false}
            hideSelectedOptions={false}
            isMulti
            type="react-select"
        />
    );
};
