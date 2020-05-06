import { decorate } from 'core-decorators';
import { bind } from 'lodash-decorators';
import memoizeOne from 'memoize-one';

import React from 'react';

import { generateFormattedDate } from 'lib/utils/datetime';
import {
    getTemplatedQueryVariables,
    renderTemplatedQuery,
} from 'lib/templated-query';

import { BindedQueryEditor } from 'components/QueryEditor/BindedQueryEditor';
import { IQuerySnippet } from 'redux/querySnippets/types';
import { IQueryEngine } from 'const/queryEngine';

import { Button } from 'ui/Button/Button';
import { CopyButton } from 'ui/CopyButton/CopyButton';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { FormField, FormFieldInputSectionRowGroup } from 'ui/Form/FormField';
import { Tag, TagGroup } from 'ui/Tag/Tag';
import { Title } from 'ui/Title/Title';
import { UserName } from 'components/UserBadge/UserName';
import './QuerySnippetView.scss';

export interface IQuerySnippetViewProps {
    querySnippet: IQuerySnippet;
    onInsert: (context: string) => any;
    queryEngineById: Record<number, IQueryEngine>;
}

export interface IQuerySnippetViewState {
    templatedQueryForm: Record<string, string>;
}

export class QuerySnippetView extends React.Component<
    IQuerySnippetViewProps,
    IQuerySnippetViewState
> {
    public readonly state = {
        templatedQueryForm: {},
    };

    public componentDidUpdate(prevProps) {
        if (this.props.querySnippet !== prevProps.querySnippet) {
            this.setState({
                templatedQueryForm: {},
            });
        }
    }

    @decorate(memoizeOne)
    public getTemplatedVariables(context: string) {
        return getTemplatedQueryVariables(context);
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

    public getTemplatedVariableEditorDOM(context: string) {
        const { templatedQueryForm } = this.state;

        const variables = this.getTemplatedVariables(context);
        if (variables.length === 0) {
            return null;
        }

        const variablesInputDOM = variables.map((varName) => (
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

    @bind
    public async handleQuerySnippetInsert() {
        const context = this.props.querySnippet.context;
        const variables = this.getTemplatedVariables(context);

        let renderedQuery = context;
        if (variables.length) {
            renderedQuery = await renderTemplatedQuery(
                context,
                this.state.templatedQueryForm
            );
        }

        if (this.props.onInsert) {
            this.props.onInsert(renderedQuery);
        }
    }

    public render() {
        const { querySnippet, queryEngineById } = this.props;

        const {
            title,
            engine_id,
            description,
            golden,
            context,

            is_public: isPublic,
            created_by: createdBy,
            created_at: createdAt,
            last_updated_by: lastUpdatedBy,
            updated_at: updatedAt,
        } = querySnippet;

        const engine = queryEngineById[engine_id];

        const publicTag = <Tag>{isPublic ? 'public' : 'private'}</Tag>;

        const goldenTag = golden ? <Tag>Golden</Tag> : null;

        const titleDOM = (
            <div className="flex-row">
                <Title>{title}</Title>
                &nbsp;
                {publicTag}
                &nbsp;
                {goldenTag}
            </div>
        );

        const authorInfoDOM = (
            <div className="snippet-author-info">
                <div>
                    Created by <UserName uid={createdBy} /> on{' '}
                    {generateFormattedDate(createdAt)}
                </div>
                <div>
                    Last updated by <UserName uid={lastUpdatedBy} /> on{' '}
                    {generateFormattedDate(updatedAt)}
                </div>
            </div>
        );

        const descriptionDOM = description ? (
            <div className="snippet-description">
                <blockquote>
                    <p>{description}</p>
                </blockquote>
            </div>
        ) : null;

        const templateDOM = this.getTemplatedVariableEditorDOM(context);

        const editorDOM = (
            <div>
                <div className="right-align">
                    <TagGroup>
                        <Tag>Engine</Tag>
                        <Tag highlighted>{engine.name}</Tag>
                    </TagGroup>
                    <br />
                </div>
                <BindedQueryEditor
                    value={context}
                    readOnly={true}
                    lineWrapping={true}
                    engine={engine}
                />
                {templateDOM}
            </div>
        );

        const controlDOM = (
            <div className="right-align">
                <CopyButton copyText={context} title="Copy To Clipboard" />
                <Button
                    type="confirm"
                    title="Insert"
                    onClick={this.handleQuerySnippetInsert}
                />
            </div>
        );

        return (
            <div className="QuerySnippetView">
                {titleDOM}
                {authorInfoDOM}
                <br />
                {descriptionDOM}
                {editorDOM}
                {controlDOM}
            </div>
        );
    }
}
