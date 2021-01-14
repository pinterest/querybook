import styled from 'styled-components';
import React from 'react';

const CenterDivContainer = styled.div`
    height: 100%;
    width: 100%;
`;

const CenterDiv = styled.div`
    margin: 0;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
`;

interface ICenterProps {
    className?: string;
}

export const Center: React.FunctionComponent<ICenterProps> = (props) => (
    <CenterDivContainer>
        <CenterDiv className={props.className}>{props.children}</CenterDiv>
    </CenterDivContainer>
);
