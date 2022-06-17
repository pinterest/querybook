---
id: storybook
title: Storybook
sidebar_label: Storybook
---

Storybook can be used to preview simple UI components under different themes and props. It provides a fast way for developers to iterate and test their components.

## How to setup and run the storybook server

To install the dependencies, run

```sh
yarn install
```

in the root directory of the project.

To run storybook, run

```sh
yarn storybook
```

Once the build completes, you can view the website on [http://localhost:6006](http://localhost:6006).

## What should be included in the storybook

Every public component created under `querybook/webapp/ui` should be included in the storybook. Please categorize the new component under one of the sections below:

-   Layout: The component is only used to position the children.
-   Button: The component is a clickable button.
-   Form: The component is commonly used in a form.
-   Stateless: The component holds no internal state.
-   Stateful: The component contains internal states.

## How to add a new story

When adding a new story for a component, please keep the `.stories.tsx` file under the same folder. For example:

```
querybook/webapp/ui/Button/Button.tsx <- main component
querybook/webapp/ui/Button/Button.stories.tsx <- storybook for the component
```

Here is an minimal example of a story. Please refer to the [storybook documentation](https://storybook.js.org/docs/react/writing-stories/introduction) if you want to add more functionalities.

```ts
import centered from '@storybook/addon-centered/react';
import React from 'react';

import { Foo } from './Foo';
export default {
     Title should be in the form of [Section]/[Name]
    title: 'Stateless/Foo',
     Include the centered docorator to center the component
    decorators: [centered],
};
export const _Foo = (args) => <Foo {...args} />;
 Provide default prop values for control
_
_Foo.args = { prop1: 'foo', prop2: 'bar' };
 Use argTypes to customize the control
_
_Foo.argTypes = { children: { control: 'text' } };
```

## Querybook specific integrations

You can use the theme picker located on the center navbar (rightmost button on the left side) to toggle between different Querybook themes.
