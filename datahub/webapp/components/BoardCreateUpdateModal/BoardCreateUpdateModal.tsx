import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as Yup from 'yup';
import { Formik, Field, Form } from 'formik';

import { createBoard, updateBoard } from 'redux/board/action';
import { IStoreState, Dispatch } from 'redux/store/types';
import { FormField } from 'ui/Form/FormField';
import { Title } from 'ui/Title/Title';
import { Button } from 'ui/Button/Button';
import { IStandardModalProps } from 'ui/Modal/types';
import { Modal } from 'ui/Modal/Modal';
import './BoardCreateUpdateModal.scss';
import { IBoardRaw } from 'const/board';
import { TextareaField } from 'ui/FormikField/TextareaField';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';

const boardFormSchema = Yup.object().shape({
    name: Yup.string().max(255).min(1),
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
            validateOnMount={false}
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
            {({
                handleSubmit,
                isSubmitting,
                errors,
                setFieldValue,
                isValid,
            }) => {
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
                                <div className="flex-right">
                                    <Button
                                        disabled={!isValid || isSubmitting}
                                        onClick={() => handleSubmit()}
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
    return (
        <Modal {...modalProps}>
            <div className="BoardCreateUpdateModal">
                <BoardCreateUpdateForm
                    boardId={boardId}
                    onComplete={onComplete}
                />
            </div>
        </Modal>
    );
};
