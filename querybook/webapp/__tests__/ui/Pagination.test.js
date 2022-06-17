import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';
import renderer from 'react-test-renderer';

import { Pagination } from '../../ui/Pagination/Pagination';

it('renders without crashing', () => {
    shallow(
        <Pagination currentPage={1} totalPage={10} onPageClick={() => null}>
            Test
        </Pagination>
    );
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(
            <Pagination currentPage={1} totalPage={10} onPageClick={() => null}>
                Test
            </Pagination>
        );
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});

describe('matches test renderer snapshot', () => {
    it('serializes the styles', () => {
        const output = renderer.create(
            <Pagination currentPage={1} totalPage={10} onPageClick={() => null}>
                Test
            </Pagination>
        );
        expect(output).toMatchSnapshot();
    });
});
