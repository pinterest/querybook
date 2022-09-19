import centered from '@storybook/addon-centered/react';
import React from 'react';

import { CodeHighlightWithMark, IProps } from './CodeHighlightWithMark';

export default {
    title: 'Stateless/CodeHighlight',
    decorators: [centered],
};

const code = `
SELECT
  supplier_name,
  city
FROM
  (
    SELECT
      *
    FROM
      suppliers
      JOIN addresses ON suppliers.address_id = addresses.id
  ) AS suppliers
WHERE
  supplier_id > 500
ORDER BY
  supplier_name asc,
  city desc;
`;

export const _CodeHighlight = (args: IProps) => (
    <CodeHighlightWithMark {...args} />
);

_CodeHighlight.args = {
    language: 'text/x-hive',
    value: code,
    theme: 'monokai',
    height: '300px',
};
