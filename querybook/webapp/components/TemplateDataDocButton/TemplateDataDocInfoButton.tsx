import * as React from 'react';
import { Link } from 'react-router-dom';

import { InfoButton } from 'ui/Button/InfoButton';
import { Content } from 'ui/Content/Content';

export const TemplateDataDocInfoButton: React.FunctionComponent = () => (
    <InfoButton layout={['bottom', 'right']}>
        <Content>
            <p>
                {'Include {{variable_name}} in your query and it will get substituted with ' +
                    'its value.'}
                <br />
                <br />
                <span>Some variables are provided automatically.</span>
                <br />
                <br />
                <span>Such as:</span>
                <ul>
                    <li>
                        {
                            '{{today}} which maps to todays date in yyyy-mm-dd format. '
                        }
                    </li>
                    <li>{"{{yesterday}} which maps to yesterday's date."}</li>
                    <li>
                        {
                            "{{latest_partition('<schema_name>.<table_name>', '<partition_key>')}} which is a function to get the latest partition of a table"
                        }
                    </li>
                </ul>
            </p>
            <br />
            <p>
                {
                    'You can also include variables in variables for recursive rendering.'
                }
            </p>
            <br />
            <p>
                <Link
                    to={
                        'https://jinja.palletsprojects.com/en/2.11.x/templates/'
                    }
                >
                    See the complete guide here.
                </Link>
            </p>
        </Content>
    </InfoButton>
);
