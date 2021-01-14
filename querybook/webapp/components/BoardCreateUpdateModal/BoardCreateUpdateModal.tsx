import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';

import { sendConfirm } from 'lib/querybookUI';
import { createBoard, updateBoard, deleteBoard } from 'redux/board/action';
import { IStoreState, Dispatch } from 'redux/store/types';
import { Title } from 'ui/Title/Title';
import { Button } from 'ui/Button/Button';
import { IStandardModalProps } from 'ui/Modal/types';
import { Modal } from 'ui/Modal/Modal';
import { IBoardRaw } from 'const/board';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';
import './BoardCreateUpdateModal.scss';

const boardFormSchema = Yup.object().shape({
    name: Yup.string().max(255).min(1).required(),
    description: Yup.string().max(5000),
    public: Yup.boolean(),
});

interface IBoardCreateUpdateFormProps {
    boardId?: number;
    onComplete: (board: IBoardRaw) => any;
}

export const BoardCreateUpdateForm: React.FunctionComponent<IBoardCreateUpdateFormProps> = ({
    boardId,
    onComplete,
}) => {
    const dispatch: Dispatch = useDispatch();
    const isCreateForm = boardId == null;
    const board = isCreateForm
        ? null
        : useSelector((state: IStoreState) => state.board.boardById[boardId]);
    const handleDeleteBoard = useCallback(() => {
        sendConfirm({
            onConfirm: () => {
                dispatch(deleteBoard(boardId));
            },
            message: 'Your list will be permanently removed.',
        });
    }, [boardId]);

    const formValues = isCreateForm
        ? {
              name: '',
              description: '',
              public: false,
          }
        : {
              name: board.name,
              description: board.description,
              public: board.public,
          };

    return (
        <Formik
            initialValues={formValues}
            validateOnMount={true}
            validationSchema={boardFormSchema}
            onSubmit={async (values) => {
                const action = isCreateForm
                    ? createBoard(
                          values.name,
                          values.description,
                          values.public
                      )
                    : updateBoard(boardId, {
                          ...values,
                      });
                onComplete(await dispatch(action));
            }}
        >
            {({ submitForm, isSubmitting, errors, setFieldValue, isValid }) => {
                const formTitle = isCreateForm ? 'New List' : 'Update List';
                const nameField = <SimpleField name="name" type="input" />;

                const descriptionField = (
                    <SimpleField
                        name="description"
                        type="textarea"
                        placeholder="Describe the use case of your list here"
                    />
                );

                return (
                    <div className="BoardCreateUpdateForm">
                        <div>
                            <Title size={4}>{formTitle}</Title>
                        </div>
                        <FormWrapper minLabelWidth="150px">
                            <Form>
                                {nameField}
                                {descriptionField}
                                <br />
                                <div className="right-align">
                                    {!isCreateForm && (
                                        <Button
                                            onClick={handleDeleteBoard}
                                            title="Delete"
                                            type="cancel"
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
> = ({ boardId, onComplete, ...modalProps }) => (
    <Modal {...modalProps}>
        <div className="BoardCreateUpdateModal">
            <BoardCreateUpdateForm boardId={boardId} onComplete={onComplete} />
        </div>
    </Modal>
);
