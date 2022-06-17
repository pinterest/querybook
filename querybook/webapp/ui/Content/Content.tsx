import styled from 'styled-components';

import './Content.scss';

export const Content = styled.div.attrs({
    className: 'Content',
})`
    h1,
    h2 {
        font-family: var(--font-accent);
        letter-spacing: var(--letter-spacing);
    }
`;
