import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';
import renderer from 'react-test-renderer';

import {
    Menu,
    MenuDivider,
    MenuInfoItem,
    MenuItem,
    MenuItemPing,
} from '../../ui/Menu/Menu';

it('renders without crashing', () => {
    shallow(
        <Menu>
            <MenuItem>
                <MenuItemPing />
            </MenuItem>
            <MenuDivider />
            <MenuInfoItem />
        </Menu>
    );
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <Menu>
                <MenuItem>
                    <MenuItemPing />
                </MenuItem>
                <MenuDivider />
                <MenuInfoItem />
            </Menu>
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <Menu>
                <MenuItem>
                    <MenuItemPing />
                </MenuItem>
                <MenuDivider />
                <MenuInfoItem />
            </Menu>
        );
        expect(output).toMatchSnapshot();
    });
});
