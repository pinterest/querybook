import { bind } from 'lodash-decorators';
import React from 'react';
import styled from 'styled-components';

import { Center } from 'ui/Center/Center';
import { Tabs } from 'ui/Tabs/Tabs';

import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { Box } from 'ui/Box/Box';
import { Message } from 'ui/Message/Message';
import { QuerybookLogo } from 'ui/QuerybookLogo/QuerybookLogo';
import { Link } from 'ui/Link/Link';
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

export class UnauthPage extends React.Component<
    IUnauthPageProps,
    IUnauthPageState
> {
    public readonly state = {
        tabKey: UNAUTH_TABS[0],
    };

    @bind
    public handleTabChange(tabKey) {
        this.setState({
            tabKey,
        });
    }

    public render() {
        const { onSuccessLogin, showSignUp } = this.props;
        const { tabKey } = this.state;

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
                                onSelect={this.handleTabChange}
                            />
                        )}
                        {form}
                    </Box>
                </StyledUnauthPage>
            </Center>
        );
    }
}
