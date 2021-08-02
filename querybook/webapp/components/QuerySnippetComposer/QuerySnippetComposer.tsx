import { bind, debounce } from 'lodash-decorators';
import React from 'react';
import { connect } from 'react-redux';
import { getTemplatedQueryVariables } from 'lib/templated-query';

import {
    queryEngineSelector,
    queryEngineByIdEnvSelector,
} from 'redux/queryEngine/selector';
import * as querySnippetsActions from 'redux/querySnippets/action';
import { IQuerySnippet, IQueryForm } from 'redux/querySnippets/types';
import { Dispatch, IStoreState } from 'redux/store/types';

import { sendConfirm } from 'lib/querybookUI';
import history from 'lib/router-history';
import { generateFormattedDate } from 'lib/utils/datetime';

import { BoundQueryEditor } from 'components/QueryEditor/BoundQueryEditor';
import { UserName } from 'components/UserBadge/UserName';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Message } from 'ui/Message/Message';
import { Title } from 'ui/Title/Title';
import { FormField } from 'ui/Form/FormField';
import { Checkbox } from 'ui/Checkbox/Checkbox';
import { Tabs } from 'ui/Tabs/Tabs';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';
import { FormWrapper } from 'ui/Form/FormWrapper';

import './QuerySnippetComposer.scss';

function showErrorModal(error) {
    sendConfirm({
        header: 'Error',
        message: (
            <Message message={`Reason ${JSON.stringify(error)}`} type="error" />
        ),
    });
}

interface IOwnProps {
    querySnippet?: IQuerySnippet;
    onSave?: (snippet: IQueryForm) => any;
}
type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type IProps = IOwnProps & StateProps & DispatchProps;

interface IState {
    form: IQueryForm;
    isUpdateForm: boolean;
    formInvalid: boolean;
    formInvalidReason: string;
    templatedVariables: string[];
}

class QuerySnippetComposerComponent extends React.PureComponent<
    IProps,
    IState
> {
    public constructor(props) {
        super(props);

        this.state = {
            form: props.querySnippet
                ? this.getFormFromSnippet(props.querySnippet)
                : this.getForm(),
            isUpdateForm: !!props.querySnippet,
            formInvalid: false,
            formInvalidReason: null,
            templatedVariables: [],
        };
    }

    @bind
    public getFormFromSnippet(snippet) {
        const {
            title,
            context,
            engine_id: engineId,
            description,
            is_public: isPublic,
            golden,
        } = snippet;
        return {
            title,
            context,
            engine_id: engineId,
            description,
            is_public: isPublic,
            golden,
        };
    }

    @bind
    public getForm() {
        return {
            title: '',
            context: '',
            engine_id: this.props.queryEngines[0].id,
            description: '',
            is_public: false,
            golden: false,
        };
    }

    @bind
    public setFormState(key, value) {
        const { form } = this.state;

        const newForm = {
            ...form,
            [key]: value,
        };

        this.setState(
            {
                form: newForm,
            },
            this.validateForm
        );
    }

    @bind
    public isFormInvalid(form): [boolean, string] {
        if (form.title.length === 0) {
            return [true, 'Title must not be empty'];
        }

        if (form.context.length === 0) {
            return [true, 'Query must not be empty'];
        }

        if (this.state.isUpdateForm) {
            const { querySnippet, user } = this.props;

            // Special logic for update
            const isDifferentForm = Object.entries(form).some(
                ([key, value]) => value !== querySnippet[key]
            );

            if (!isDifferentForm) {
                return [true, null];
            }

            // Pre condition
            if (
                !querySnippet.is_public &&
                !(user.uid === querySnippet.created_by)
            ) {
                return [true, "You cannot edit other people's private snippet"];
            }

            // Post condition
            if (
                form.is_public !== querySnippet.is_public &&
                user.uid !== querySnippet.created_by
            ) {
                return [
                    true,
                    "You cannot change other people's public/private option",
                ];
            }
        }

        return [false, ''];
    }

    @debounce(1000)
    public validateForm() {
        const { form } = this.state;

        const [formInvalid, formInvalidReason] = this.isFormInvalid(form);
        this.setState({
            formInvalid,
            formInvalidReason,
        });
    }

    @bind
    public onTitleChange(event) {
        this.setFormState('title', event.target.value);
    }

    @bind
    public onQueryChange(context) {
        this.setFormState('context', context);
        this.parseTemplatedQueries(context);
    }

    @bind
    @debounce(1000)
    public async parseTemplatedQueries(context) {
        context = context || '';
        try {
            this.setState({
                templatedVariables: await getTemplatedQueryVariables(context),
            });
        } catch (e) {
            this.setState({
                templatedVariables: [],
                formInvalid: true,
                formInvalidReason: String(e),
            });
            throw e;
        }
    }

    @bind
    public onEngineChange(engineId: number) {
        this.setFormState('engine_id', engineId);
    }

    @bind
    public onDescriptionChange(value: string) {
        this.setFormState('description', value);
    }

    @bind
    public onPublicChange(isPublic) {
        this.setFormState('is_public', isPublic);
    }

    @bind
    public onGoldenChange(golden) {
        this.setFormState('golden', golden);
    }

    @bind
    public handleDelete() {
        return new Promise<void>((resolve) => {
            const { querySnippet } = this.props;

            sendConfirm({
                message: 'This template will be removed PERMANENTLY.',
                onConfirm: async () => {
                    try {
                        await this.props.deleteQuerySnippet(querySnippet);
                        history.push('/template/');
                    } catch (error) {
                        showErrorModal(error);
                    }
                    resolve();
                },
            });
        });
    }

    public componentDidMount() {
        this.validateForm();

        if (this.state.form) {
            this.parseTemplatedQueries(this.state.form.context);
        }
    }

    public componentDidUpdate(prevProps) {
        if (this.props.querySnippet !== prevProps.querySnippet) {
            this.setState(
                {
                    form: this.getFormFromSnippet(this.props.querySnippet),
                },
                () => {
                    this.validateForm();
                    if (this.state.form) {
                        this.parseTemplatedQueries(this.state.form);
                    }
                }
            );
        }
    }

    public getSnippetUpdateInfoDOM() {
        const { querySnippet } = this.props;

        if (!querySnippet) {
            return null;
        }

        const contentDOM = (
            <div>
                <div>
                    Created by: <UserName uid={querySnippet.created_by} /> on{' '}
                    {generateFormattedDate(querySnippet.created_at)}
                </div>
                <div>
                    Last updated by:{' '}
                    <UserName uid={querySnippet.last_updated_by} /> on{' '}
                    {generateFormattedDate(querySnippet.updated_at)}
                </div>
            </div>
        );

        return <Message message={contentDOM} type="info" />;
    }

    public getQuerySnippetForm() {
        const {
            queryEngineById,

            queryEngines,

            user,
        } = this.props;

        const { form, templatedVariables } = this.state;
        const queryEngine = queryEngineById[form.engine_id];

        const titleField = (
            <FormField label="Title" help="Title of Snippet, used for search.">
                <input
                    type="text"
                    placeholder="Template title"
                    value={form.title}
                    onChange={this.onTitleChange}
                />
            </FormField>
        );

        const templatedQueriesDOM = templatedVariables.length ? (
            <>
                <br />
                <Message
                    message={
                        <div>
                            <p>Here are all the templated variables</p>
                            <p>{templatedVariables.join(', ')}</p>
                        </div>
                    }
                />
            </>
        ) : null;

        const contextField = (
            <FormField label="Query">
                <div>
                    <BoundQueryEditor
                        value={form.context}
                        lineWrapping={true}
                        onChange={this.onQueryChange}
                        engine={queryEngine}
                        allowFullScreen
                    />
                    {templatedQueriesDOM}
                </div>
            </FormField>
        );

        const engineField = (
            <FormField
                label="Engine"
                help="Pick the default engine you think the query should run on"
            >
                <SimpleReactSelect<number>
                    options={queryEngines.map((engine) => ({
                        value: engine.id,
                        label: engine.name,
                    }))}
                    value={form.engine_id}
                    onChange={this.onEngineChange}
                />
            </FormField>
        );

        const descriptionField = (
            <FormField label="Description">
                <ResizableTextArea
                    placeholder="Describe the functionality of your query here"
                    value={form.description}
                    onChange={this.onDescriptionChange}
                    autoResize={false}
                    rows={4}
                />
            </FormField>
        );

        const publicField = (
            <FormField
                label="Scope"
                help={
                    'Public snippets can be searched/viewed/modified by anyone.' +
                    'Private snippets can only be searched/modified by the' +
                    'creator, but anyone can view it given the link.'
                }
            >
                <Tabs
                    selectedTabKey={form.is_public ? 'Public' : 'Private'}
                    pills
                    items={['Private', 'Public']}
                    onSelect={(checked) =>
                        this.onPublicChange(checked === 'Public')
                    }
                />
            </FormField>
        );

        const goldenField = (
            <FormField
                label="Golden"
                help="Only Admins can certify golden snippets."
            >
                <Checkbox
                    onChange={user.isAdmin ? this.onGoldenChange : null}
                    value={form.golden}
                    disabled={!user.isAdmin}
                    title="I certify this golden snippet."
                />
            </FormField>
        );

        return (
            <FormWrapper minLabelWidth="120px">
                {titleField}
                {engineField}
                {publicField}
                {goldenField}
                {descriptionField}
                {contextField}
            </FormWrapper>
        );
    }

    public handleSave = async () => {
        const {
            querySnippet,
            updateQuerySnippet,
            saveQuerySnippet,
        } = this.props;

        const { form, isUpdateForm } = this.state;

        const saveOrUpdateSnippet = isUpdateForm
            ? updateQuerySnippet
            : saveQuerySnippet;

        let params;
        if (isUpdateForm) {
            params = Object.entries(form).reduce(
                (hash, [key, value]) => {
                    if (value !== querySnippet[key]) {
                        hash[key] = value;
                    }
                    return hash;
                },
                {
                    id: querySnippet.id,
                }
            );
        } else {
            params = form;
        }

        try {
            const newQuerySnippet = await saveOrUpdateSnippet(params);

            if (this.props.onSave) {
                this.props.onSave(newQuerySnippet);
            }
        } catch (error) {
            console.error(error);
            showErrorModal(error);
        }
    };

    public render() {
        const { querySnippet, user } = this.props;

        const {
            isUpdateForm,

            formInvalid,
            formInvalidReason,
        } = this.state;

        const invalidWarningMessage =
            formInvalid && !!formInvalidReason ? (
                <Message
                    title="Invalid Form"
                    message={formInvalidReason}
                    type="error"
                />
            ) : null;

        const controls = [
            <AsyncButton
                color="confirm"
                onClick={
                    formInvalid ? () => Promise.resolve() : this.handleSave
                }
                disabled={formInvalid}
                key="save"
                title="Save"
            />,
        ];

        const controlsDOM = <div className="right-align">{controls}</div>;

        const composerTitle = isUpdateForm
            ? 'Update Template'
            : 'Create Template';

        const canUserDelete =
            isUpdateForm &&
            (querySnippet.created_by === user.uid || user.isAdmin);

        const titleDOM = canUserDelete ? (
            <div className="horizontal-space-between">
                {isUpdateForm ? <Title>{composerTitle}</Title> : null}
                <div>
                    <AsyncButton
                        disableWhileAsync={true}
                        key={'delete'}
                        onClick={this.handleDelete}
                        icon="trash"
                        title="Delete"
                    />
                </div>
            </div>
        ) : isUpdateForm ? (
            <Title>{composerTitle}</Title>
        ) : null;

        return (
            <div className={'QuerySnippetComposer '}>
                {titleDOM}
                {this.getSnippetUpdateInfoDOM()}
                {this.getQuerySnippetForm()}
                {invalidWarningMessage}
                {controlsDOM}
            </div>
        );
    }
}

const mapStateToProps = (state: IStoreState) => ({
    queryEngines: queryEngineSelector(state),
    queryEngineById: queryEngineByIdEnvSelector(state),
    user: state.user.myUserInfo,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    saveQuerySnippet: (snippet: IQueryForm) =>
        dispatch(querySnippetsActions.saveQuerySnippet(snippet)),
    updateQuerySnippet: (snippet: IQueryForm) =>
        dispatch(querySnippetsActions.updateQuerySnippet(snippet)),
    deleteQuerySnippet: (snippet: IQuerySnippet) =>
        dispatch(querySnippetsActions.deleteQuerySnippet(snippet)),
});

export const QuerySnippetComposer = connect(
    mapStateToProps,
    mapDispatchToProps
)(QuerySnippetComposerComponent);
