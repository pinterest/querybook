import React, { useState } from 'react';
import styled from 'styled-components';

import { Box } from 'ui/Box/Box';
import { Center } from 'ui/Center/Center';
import { Link } from 'ui/Link/Link';
import { Message } from 'ui/Message/Message';
import { QuerybookLogo } from 'ui/QuerybookLogo/QuerybookLogo';
import { Tabs } from 'ui/Tabs/Tabs';

import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

import './UnauthPage.scss';

export interface IUnauthPageProps {
    onSuccessLogin: () => any;
    showSignUp: boolean;
}

export interface IUnauthPageState {
    tabKey: string;
}

const StyledUnauthPage = styled.div`
    width: 50vw;
    max-width: 550px;
`;
const UNAUTH_TABS = ['Login', 'Signup'];

export const UnauthPage = React.memo<IUnauthPageProps>(
    ({ onSuccessLogin, showSignUp }) => {
        const [tabKey, setTabKey] = useState(UNAUTH_TABS[0]);
        const form =
            tabKey === 'Login' || !showSignUp ? (
                <LoginForm onSuccessLogin={onSuccessLogin} />
            ) : (
                <SignupForm onSuccessLogin={onSuccessLogin} />
            );

        // This warning message is for whomever is using password_auth
        // as it is an insecure way to register and use Querybook
        const querybookWarningMessage = showSignUp && (
            <div className="mb24">
                <Message type="error">
                    <p>
                        NOTE: This signup/login flow is only for people who
                        wants to <b>temporarily</b> try out Querybook.
                    </p>
                    <p>
                        The user name and password (as salted hash) information
                        is only stored in the Querybook Database and is not
                        passed anywhere.
                    </p>
                    <br />
                    <p>
                        Check out{' '}
                        <Link
                            to="https://www.querybook.org/docs/integrations/add_auth"
                            naturalLink
                        >
                            the authentication guide
                        </Link>{' '}
                        to learn how to set it up for your org.
                    </p>
                </Message>
            </div>
        );

        return (
            <Center>
                <StyledUnauthPage>
                    <div className="center-align mb8">
                        <QuerybookLogo />
                    </div>
                    {querybookWarningMessage}
                    <Box>
                        {showSignUp && (
                            <Tabs
                                align="center"
                                items={UNAUTH_TABS}
                                selectedTabKey={tabKey}
                                onSelect={setTabKey}
                            />
                        )}
                        {form}
                    </Box>
                </StyledUnauthPage>
            </Center>
        );
    }
);
