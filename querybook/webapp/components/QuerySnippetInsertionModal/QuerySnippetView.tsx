import { decorate } from 'core-decorators';
import { bind } from 'lodash-decorators';
import memoizeOne from 'memoize-one';
import React from 'react';

import { BoundQueryEditor } from 'components/QueryEditor/BoundQueryEditor';
import { UserName } from 'components/UserBadge/UserName';
import { IQueryEngine } from 'const/queryEngine';
import {
    getTemplatedQueryVariables,
    renderTemplatedQuery,
} from 'lib/templated-query';
import { generateFormattedDate } from 'lib/utils/datetime';
import { IQuerySnippet } from 'redux/querySnippets/types';
import { Button } from 'ui/Button/Button';
import { Card } from 'ui/Card/Card';
import { CopyButton } from 'ui/CopyButton/CopyButton';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { FormField, FormFieldInputSectionRowGroup } from 'ui/Form/FormField';
import { Tag, TagGroup } from 'ui/Tag/Tag';
import { Title } from 'ui/Title/Title';

import './QuerySnippetView.scss';

export interface IQuerySnippetViewProps {
    querySnippet: IQuerySnippet;
    onInsert: (context: string) => any;
    queryEngineById: Record<number, IQueryEngine>;
}

export interface IQuerySnippetViewState {
    templatedQueryForm: Record<string, string>;
    templatedVariables: string[];
}

export class QuerySnippetView extends React.PureComponent<
    IQuerySnippetViewProps,
    IQuerySnippetViewState
> {
    public readonly state = {
        templatedQueryForm: {},
        templatedVariables: [],
    };

    @decorate(memoizeOne)
    public async getTemplatedVariables(context: string) {
        this.setState({
            templatedVariables: await getTemplatedQueryVariables(context),
        });
    }

    @bind
    public updateTemplatedQueryForm(fieldName, fieldVal) {
        this.setState(({ templatedQueryForm }) => ({
            templatedQueryForm: {
                ...templatedQueryForm,
                [fieldName]: fieldVal,
            },
        }));
    }

    @bind
    public async handleQuerySnippetInsert() {
        const { context, engine_id: engineId } = this.props.querySnippet;
        const { templatedVariables } = this.state;

        let renderedQuery = context;
        if (templatedVariables.length) {
            renderedQuery = await renderTemplatedQuery(
                context,
                this.state.templatedQueryForm,
                engineId
            );
        }

        if (this.props.onInsert) {
            this.props.onInsert(renderedQuery);
        }
    }

    public componentDidMount() {
        this.getTemplatedVariables(this.props.querySnippet.context);
    }
    public componentDidUpdate(prevProps) {
        if (this.props.querySnippet !== prevProps.querySnippet) {
            this.setState({
                templatedQueryForm: {},
            });
            this.getTemplatedVariables(this.props.querySnippet.context);
        }
    }

    public getTemplatedVariableEditorDOM() {
        const { templatedQueryForm, templatedVariables } = this.state;

        if (templatedVariables.length === 0) {
            return null;
        }

        const variablesInputDOM = templatedVariables.map((varName) => (
            <FormField key={varName} label={varName}>
                <DebouncedInput
                    value={templatedQueryForm[varName] || ''}
                    onChange={this.updateTemplatedQueryForm.bind(this, varName)}
                    flex
                />
            </FormField>
        ));

        return (
            <FormFieldInputSectionRowGroup>
                {variablesInputDOM}
            </FormFieldInputSectionRowGroup>
        );
    }

    public render() {
        const { querySnippet, queryEngineById } = this.props;

        const {
            title,
            engine_id: engineId,
            description,
            golden,
            context,

            is_public: isPublic,
            created_by: createdBy,
            created_at: createdAt,
            last_updated_by: lastUpdatedBy,
            updated_at: updatedAt,
        } = querySnippet;

        const engine = queryEngineById[engineId];

        const publicTag = <Tag>{isPublic ? 'public' : 'private'}</Tag>;

        const goldenTag = golden ? <Tag>Golden</Tag> : null;

        const topDOM = (
            <div className="mb8">
                <TagGroup>
                    <Tag>Engine</Tag>
                    <Tag highlighted>{engine.name}</Tag>
                </TagGroup>
            </div>
        );

        const titleDOM = (
            <div className="flex-row mb8">
                <Title size="large">{title}</Title>
                <div className="flex-row ml12">
                    {publicTag}
                    {goldenTag}
                </div>
            </div>
        );

        const authorInfoDOM = (
            <Card alignLeft className="mb12">
                <div>
                    <span>Created by</span>
                    <span className="mh4 author-info">
                        <UserName uid={createdBy} />
                    </span>
                    <span>on</span>
                    <span className="mh4 author-info">
                        {generateFormattedDate(createdAt)}
                    </span>
                </div>
                <div>
                    <span>Last updated by</span>
                    <span className="mh4 author-info">
                        <UserName uid={lastUpdatedBy} />
                    </span>
                    <span>on</span>
                    <span className="mh4 author-info">
                        {generateFormattedDate(updatedAt)}
                    </span>
                </div>
            </Card>
        );

        const descriptionDOM = description ? (
            <div className="snippet-description mb12">
                <blockquote>
                    <p>{description}</p>
                </blockquote>
            </div>
        ) : null;

        const templateDOM = this.getTemplatedVariableEditorDOM();

        const editorDOM = (
            <div>
                <BoundQueryEditor
                    value={context}
                    readOnly={true}
                    lineWrapping={true}
                    engine={engine}
                    allowFullScreen
                />
                {templateDOM}
            </div>
        );

        const controlDOM = (
            <div className="right-align mt12">
                <CopyButton copyText={context} title="Copy To Clipboard" />
                <Button
                    color="confirm"
                    title="Insert"
                    onClick={this.handleQuerySnippetInsert}
                />
            </div>
        );

        return (
            <div className="QuerySnippetView">
                {topDOM}
                {titleDOM}
                {authorInfoDOM}
                {descriptionDOM}
                {editorDOM}
                {controlDOM}
            </div>
        );
    }
}
