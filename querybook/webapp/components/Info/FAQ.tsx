import * as React from 'react';

import { Content } from 'ui/Content/Content';
import { Markdown } from 'ui/Markdown/Markdown';
import { Subtitle } from 'ui/Title/Title';

import './FAQ.scss';

const faqs: Array<{ q: string; a: string }> = require('config/faqs.yaml').faqs;

export const FAQ: React.FunctionComponent = () => (
    <div className="FAQ">
        {faqs.map((faq, idx) => {
            const { q: question, a: answer } = faq;
            return (
                <div className="FAQ-item mb24" key={idx}>
                    <Subtitle className="FAQ-question">{question}</Subtitle>
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
