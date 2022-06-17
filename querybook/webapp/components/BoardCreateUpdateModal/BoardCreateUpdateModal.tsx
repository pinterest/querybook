import { Form, Formik } from 'formik';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';

import { IBoardRaw } from 'const/board';
import { sendConfirm } from 'lib/querybookUI';
import {
    convertContentStateToHTML,
    convertRawToContentState,
} from 'lib/richtext/serialize';
import { createBoard, deleteBoard, updateBoard } from 'redux/board/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Button } from 'ui/Button/Button';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { Modal } from 'ui/Modal/Modal';
import { IStandardModalProps } from 'ui/Modal/types';

const boardFormSchema = Yup.object().shape({
    name: Yup.string().max(255).min(1).required(),
    description: Yup.string().max(5000),
    public: Yup.boolean(),
});

interface IBoardCreateUpdateFormProps {
    boardId?: number;
    onComplete: (board: IBoardRaw) => any;
}

export const BoardCreateUpdateForm: React.FunctionComponent<
    IBoardCreateUpdateFormProps
> = ({ boardId, onComplete }) => {
    const dispatch: Dispatch = useDispatch();
    const isCreateForm = boardId == null;
    const board = useSelector((state: IStoreState) =>
        isCreateForm ? null : state.board.boardById[boardId]
    );
    const handleDeleteBoard = useCallback(() => {
        sendConfirm({
            onConfirm: () => {
                dispatch(deleteBoard(boardId));
            },
            message: 'Your list will be permanently removed.',
        });
    }, [boardId]);

    const formValues = React.useMemo(
        () =>
            isCreateForm
                ? {
                      name: '',
                      description: convertRawToContentState(''),
                      public: false,
                  }
                : {
                      name: board.name,
                      description: convertRawToContentState(board.description),
                      public: board.public,
                  },
        [board, isCreateForm]
    );

    return (
        <Formik
            initialValues={formValues}
            validateOnMount={true}
            validationSchema={boardFormSchema}
            onSubmit={async (values) => {
                const description = convertContentStateToHTML(
                    values.description
                );
                const action = isCreateForm
                    ? createBoard(values.name, description, values.public)
                    : updateBoard(boardId, {
                          ...values,
                          description,
                      });
                onComplete(await dispatch(action));
            }}
        >
            {({ submitForm, isSubmitting, isValid }) => {
                const nameField = <SimpleField name="name" type="input" />;
                // TODO: enable when sharing is possible
                // const publicField = <SimpleField name="public" type="toggle" />;

                const descriptionField = (
                    <SimpleField name="description" type="rich-text" />
                );

                return (
                    <div className="BoardCreateUpdateForm">
                        <FormWrapper minLabelWidth="150px">
                            <Form>
                                {nameField}
                                {/* {publicField} */}
                                {descriptionField}
                                <br />
                                <div className="right-align">
                                    {!isCreateForm && (
                                        <Button
                                            onClick={handleDeleteBoard}
                                            title="Delete"
                                            color="cancel"
                                        />
                                    )}
                                    <Button
                                        disabled={!isValid || isSubmitting}
                                        onClick={submitForm}
                                        title={
                                            isCreateForm ? 'Create' : 'Update'
                                        }
                                    />
                                </div>
                            </Form>
                        </FormWrapper>
                    </div>
                );
            }}
        </Formik>
    );
};

export const BoardCreateUpdateModal: React.FunctionComponent<
    IBoardCreateUpdateFormProps & IStandardModalProps
> = ({ boardId, onComplete, ...modalProps }) => {
    const modalTitle = boardId == null ? 'Create List' : 'Update List';
    return (
        <Modal {...modalProps} title={modalTitle}>
            <div className="BoardCreateUpdateModal">
                <BoardCreateUpdateForm
                    boardId={boardId}
                    onComplete={onComplete}
                />
            </div>
        </Modal>
    );
};
