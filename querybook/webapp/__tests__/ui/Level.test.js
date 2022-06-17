import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';
import renderer from 'react-test-renderer';

import { Level, LevelItem } from '../../ui/Level/Level';

it('renders without crashing', () => {
    shallow(
        <Level>
            <LevelItem />
        </Level>
    );
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <Level>
                <LevelItem />
            </Level>
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <Level>
                <LevelItem />
            </Level>
        );
        expect(output).toMatchSnapshot();
    });
});
