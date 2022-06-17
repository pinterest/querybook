import { mount, shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';

import { makeSelectOptions, Select } from '../../ui/Select/Select';

it('renders without crashing', () => {
    shallow(<Select value="test" onChange={() => null} />);
});

describe('Select behavior', () => {
    it('selects the correct field', () => {
        const onChangeMock = jest.fn();
        const wrapper = mount(
            <Select
                value="test"
                onChange={(event) => onChangeMock(event.target.value)}
            >
                {makeSelectOptions(['test', 'test1', 'test2'])}
            </Select>
        );
        wrapper.find('select').instance().selectedIndex = 2;
        wrapper.find('select').simulate('change');

        expect(wrapper.find('option')).toHaveLength(3);
        expect(onChangeMock).toHaveBeenCalledTimes(1);
        expect(onChangeMock).toHaveBeenCalledWith('test2');
    });

    it('deselects correctly', () => {
        const onChangeMock = jest.fn();
        const wrapper = mount(
            <Select
                value="test"
                onChange={(event) => onChangeMock(event.target.value)}
                withDeselect
            >
                {makeSelectOptions(['test', 'test1', 'test2'])}
            </Select>
        );
        wrapper.find('select').instance().selectedIndex = 0;
        wrapper.find('select').simulate('change');

        expect(wrapper.find('option')).toHaveLength(4);
        expect(onChangeMock).toHaveBeenCalledTimes(1);
        expect(onChangeMock).toHaveBeenCalledWith('');
    });
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<Select value="test" onChange={() => null} />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot - placeholder', () => {
        const wrapper = shallow(
            <Select value="test" onChange={() => null} disabled />
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});
