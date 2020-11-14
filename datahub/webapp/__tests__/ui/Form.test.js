import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import {
    FormField,
    FormFieldInputSectionRowGroup,
    FormFieldInputSectionRow,
    FormFieldHelpSection,
    FormFieldErrorSection,
    FormFieldInputSection,
} from '../../ui/Form/FormField';
import { FormWrapper } from '../../ui/Form/FormWrapper';

it('renders without crashing', () => {
    shallow(<FormField />);
});
it('renders without crashing', () => {
    shallow(
        <FormField>
            <FormFieldInputSectionRowGroup>
                <FormFieldInputSectionRow>
                    <FormFieldInputSection>Test</FormFieldInputSection>
                </FormFieldInputSectionRow>
                <FormFieldHelpSection>Test</FormFieldHelpSection>
                <FormFieldErrorSection>Test</FormFieldErrorSection>
            </FormFieldInputSectionRowGroup>
        </FormField>
    );
});
it('renders without crashing', () => {
    shallow(<FormWrapper />);
});

describe('matches enzyme snapshots', () => {
    it('matches snapshot', () => {
        const wrapper = shallow(<FormField />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
    it('matches snapshot', () => {
        const wrapper = shallow(<FormWrapper />);
        const serialized = toJson(wrapper);
        expect(serialized).toMatchSnapshot();
    });
});
