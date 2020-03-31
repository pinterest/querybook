import classNames from 'classnames';
import React from 'react';
import styled from 'styled-components';

const StyledNav = styled.div`
    background-color: var(--bg-color);

    &.navbar.has-shadow {
        box-shadow: 0 2px 0 0 var(--light-bg-color);
    }
`;

const ItemContent = styled.div`
    ${({ isFullWidth }) =>
        isFullWidth &&
        `
        max-width: none;
    `};

    min-height: 100%;
    width: 100%; // Want 100%
    max-width: 1250px; // But only up to 1250px
    margin: 0px auto;
`;

interface IBaseNavbarItem {
    onClick?: () => any;
    className?: string;
}

interface IPlainNavbarItem extends IBaseNavbarItem {
    // For tabs
    name: string;
    key: string;
}

interface ICustomNavbarItem extends IBaseNavbarItem {
    // For custom content
    customContent: React.ReactChild;
}
type INavbarItem = IPlainNavbarItem | ICustomNavbarItem;

interface INavbarProps {
    brandItems: INavbarItem[];
    leftItems: INavbarItem[];
    rightItems: INavbarItem[];

    selected: string;
    className: string;
    isFullWidth: boolean;
}

interface INavbarState {
    burgerMenuActive: boolean;
}

export class Navbar extends React.PureComponent<INavbarProps, INavbarState> {
    public static defaultProps = {
        brandItems: [],
        leftItems: [],
        rightTabs: [],
        selected: null,
        className: '',
        isFullWidth: false,
    };

    public readonly state = {
        burgerMenuActive: false,
    };

    public generateItemsDOM(items: INavbarItem[], selected: string) {
        return (items || []).map((item, index) => {
            return 'customContent' in item ? (
                <div
                    className={'navbar-item ' + (item.className || '')}
                    key={index}
                    onClick={item.onClick}
                >
                    {item.customContent}
                </div>
            ) : (
                <a
                    className={`navbar-item is-tab ${
                        item.key === selected ? 'is-active' : ''
                    } ${item.className || ''}`}
                    onClick={item.onClick}
                    key={index}
                >
                    {item.name}
                </a>
            );
        });
    }

    public toggleBurgerMenu = () => {
        this.setState(({ burgerMenuActive }) => ({
            burgerMenuActive: !burgerMenuActive,
        }));
    };

    public render() {
        const {
            brandItems,
            leftItems,
            rightItems,
            selected,
            className,
            isFullWidth,
        } = this.props;

        const { burgerMenuActive } = this.state;

        const brandItemsDOM = this.generateItemsDOM(brandItems, selected);
        const leftItemsDOM = this.generateItemsDOM(leftItems, selected);
        const rightItemsDOM = this.generateItemsDOM(rightItems, selected);

        const finalClassName = 'Navbar navbar ' + className;

        const burgerButtonClassName = classNames({
            'navbar-burger': true,
            'is-active': burgerMenuActive,
        });

        const navbarMenuClassName = classNames({
            'navbar-menu': true,
            'is-active': burgerMenuActive,
        });

        // TODO(datahub): Hamburger menus, and check data-target="navbarExampleTransparentExample" in:
        // https://bulma.io/documentation/components/navbar/
        return (
            <StyledNav className={finalClassName}>
                <ItemContent isFullWidth={isFullWidth}>
                    <div className="container-no-more">
                        <div className="navbar-tabs">
                            <div className="navbar-brand">
                                {brandItemsDOM}
                                <a
                                    role="button"
                                    className={burgerButtonClassName}
                                    onClick={this.toggleBurgerMenu}
                                >
                                    <span aria-hidden="true" />
                                    <span aria-hidden="true" />
                                    <span aria-hidden="true" />
                                </a>
                            </div>
                            <div className={navbarMenuClassName}>
                                <div className="navbar-start">
                                    {leftItemsDOM}
                                </div>

                                <div className="navbar-end">
                                    {rightItemsDOM}
                                </div>
                            </div>
                        </div>
                    </div>
                </ItemContent>
            </StyledNav>
        );
    }
}
