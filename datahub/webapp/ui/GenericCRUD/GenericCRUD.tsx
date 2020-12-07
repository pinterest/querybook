import { produce } from 'immer';
import { bind, memoize } from 'lodash-decorators';
import React from 'react';
import styled from 'styled-components';

import { sendConfirm } from 'lib/globalUI';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button } from 'ui/Button/Button';
import { Level, LevelItem } from 'ui/Level/Level';
import { Divider } from 'ui/Divider/Divider';
import { Loader } from 'ui/Loader/Loader';
import { Title } from 'ui/Title/Title';
import { updateValue } from 'ui/SmartForm/SmartForm';

const StyledItemContainer = styled.div`
    &:not(:last-child) {
        margin-bottom: 100px;
    }
`;

interface IWithId {
    id?: number;
}

export interface IGenericCRUDProps<T> {
    getItems: () => Promise<T[]>;

    getNewItem?: () => Promise<T>;
    createItem?: (item: T) => Promise<T>;

    updateItem?: (item: T) => Promise<T>;
    deleteItem?: (item: T) => Promise<any>;

    // Refresh function when a new item is created, deleted, or updated
    onItemCUD?: (item?: T) => any;

    validateItem?: (item: T) => [boolean, string];
    renderItem: (
        item: T,
        updator: (fieldName: string, fieldValue: any) => void,
        isNewItem: boolean
    ) => React.ReactChild;
}

export interface IGenericCRUDState<T> {
    items?: T[];
    newItem?: T;
}

// This is a generic crud tool to handle basic create, read, update delete functionalities
export class GenericCRUD<T extends IWithId> extends React.PureComponent<
    IGenericCRUDProps<T>,
    IGenericCRUDState<T>
> {
    public readonly state = {
        items: null,
        newItem: null,
    };

    @bind
    public async onItemCUD(item?: T) {
        if (this.props.onItemCUD) {
            await this.props.onItemCUD(item);
        }
    }

    @bind
    public async handleLoadItems() {
        return new Promise(async (resolve, reject) => {
            try {
                const items = await this.props.getItems();
                this.setState(
                    {
                        items,
                    },
                    resolve
                );
            } catch (e) {
                reject(e);
            }
        });
    }

    @bind
    public async handleCreateNewItem() {
        const newItem = await this.props.getNewItem();
        await this.onItemCUD(newItem);

        this.setState({
            newItem,
        });
    }

    @bind
    public async handleDeleteNewItem() {
        this.setState({
            newItem: null,
        });
    }

    @bind
    public async handleSaveNewItem() {
        const savedItem = await this.props.createItem(this.state.newItem);
        await this.onItemCUD(savedItem);

        this.setState({
            newItem: null,
            items: [...this.state.items, savedItem],
        });
    }

    @bind
    public async handleSaveItem(itemToSave: T) {
        const savedItem = await this.props.updateItem(itemToSave);
        await this.onItemCUD();

        this.setState({
            items: this.state.items.map((item) =>
                item.id === savedItem.id ? savedItem : item
            ),
        });
    }

    @bind
    public updateItem(
        index: number,
        isNewItem: boolean,
        item: T,
        fieldName: string,
        // IMPORTANT: when fieldVal is undefined, it means deletion
        fieldVal: any
    ) {
        if (isNewItem) {
            // New Item
            this.setState(({ newItem }) => ({
                newItem: updateValue(newItem, fieldName, fieldVal),
            }));
        } else {
            this.setState(({ items }) => ({
                items: [
                    ...items.slice(0, index),
                    updateValue(items[index], fieldName, fieldVal),
                    ...items.slice(index + 1),
                ],
            }));
        }
    }

    @memoize
    public validateItemMemoized(item: T): [boolean, string] {
        if (this.props.validateItem) {
            return this.props.validateItem(item);
        }
        return [true, ''];
    }

    @bind
    public handleDeleteItem(itemToDelete: T) {
        return new Promise((resolve) => {
            sendConfirm({
                message: 'Once deleted, the item cannot be recovered.',
                onConfirm: async () => {
                    await this.props.deleteItem(itemToDelete);
                    await this.onItemCUD();

                    this.setState(
                        ({ items }) => ({
                            items: items.filter(
                                (item) => item.id !== itemToDelete.id
                            ),
                        }),
                        resolve
                    );
                },
                onDismiss: resolve,
            });
        });
    }

    @bind
    public renderUI() {
        const { createItem } = this.props;
        const { items = [], newItem } = this.state;
        const itemsDOM = items.map((item, index) =>
            this.itemRenderer(item, index, false)
        );

        let newItemUI = null;
        if (createItem) {
            newItemUI = newItem ? (
                <div>{this.itemRenderer(newItem, null, true)}</div>
            ) : (
                <div>
                    <Button
                        title="New"
                        icon="plus"
                        onClick={this.handleCreateNewItem}
                    />
                </div>
            );
        }

        return (
            <div className="GenericCRUD">
                {newItemUI}
                {newItemUI ? <Divider /> : null}
                {itemsDOM}
            </div>
        );
    }

    public itemRenderer(item: T, index: number, isNewItem: boolean) {
        const { createItem, updateItem, deleteItem } = this.props;
        const [isItemValid, invalidReason] = this.validateItemMemoized(item);

        const deleteButton = isNewItem ? (
            <AsyncButton
                title="Delete"
                icon="trash"
                onClick={this.handleDeleteNewItem}
            />
        ) : (
            deleteItem && (
                <AsyncButton
                    title="Delete"
                    icon="trash"
                    onClick={this.handleDeleteItem.bind(this, item)}
                />
            )
        );
        const saveButton = (isNewItem ? createItem : updateItem) && (
            <AsyncButton
                disabled={!isItemValid}
                title="Save"
                icon="save"
                onClick={
                    isNewItem
                        ? this.handleSaveNewItem
                        : this.handleSaveItem.bind(this, item)
                }
            />
        );

        const invalidMessage = isItemValid ? null : (
            <div>
                <Title size={6} color={'red'}>
                    {invalidReason}
                </Title>
            </div>
        );

        return (
            <StyledItemContainer key={isNewItem ? 'new-item' : item.id}>
                {this.props.renderItem(
                    item,
                    this.updateItem.bind(this, index, isNewItem, item),
                    isNewItem
                )}
                <div>
                    <br />
                    <Level>
                        <LevelItem>{invalidMessage}</LevelItem>
                        <LevelItem>
                            <div>{deleteButton}</div>
                            <div>{saveButton}</div>
                        </LevelItem>
                    </Level>
                </div>
            </StyledItemContainer>
        );
    }

    public render() {
        return (
            <Loader
                item={this.state.items}
                itemLoader={this.handleLoadItems}
                renderer={this.renderUI}
            />
        );
    }
}
