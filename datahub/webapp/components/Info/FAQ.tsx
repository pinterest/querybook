import * as React from 'react';

import { Content } from 'ui/Content/Content';
import { Title } from 'ui/Title/Title';
import { Markdown } from 'ui/Markdown/Markdown';

import './FAQ.scss';

const faqs: Array<[string, string]> = require('config/faqs.yaml').faqs;

export const FAQ: React.FunctionComponent = () => (
    <div className="FAQ m12">
        {faqs.map((faq, idx) => {
            const [question, answer] = faq;
            return (
                <div className="FAQ-item mb24" key={idx}>
                    <Title subtitle size={4} className="FAQ-question">
                        {question}
                    </Title>
                    <div className="FAQ-answer m12">
                        <Content>
                            <Markdown>{answer}</Markdown>
                        </Content>
                    </div>
                </div>
            );
        })}
    </div>
);
