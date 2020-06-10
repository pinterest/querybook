import { bind } from 'lodash-decorators';
import React from 'react';
import styled from 'styled-components';

import { Center } from 'ui/Center/Center';
import { Tabs, ITabItem } from 'ui/Tabs/Tabs';

import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { Box } from 'ui/Box/Box';
import './UnauthPage.scss';
import { Message } from 'ui/Message/Message';

export interface IUnauthPageProps {
    onSuccessLogin: () => any;
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
        const { onSuccessLogin } = this.props;
        const { tabKey } = this.state;

        const form =
            tabKey === 'Login' ? (
                <LoginForm onSuccessLogin={onSuccessLogin} />
            ) : (
                <SignupForm onSuccessLogin={onSuccessLogin} />
            );

        return (
            <Center>
                <StyledUnauthPage>
                    <div className="mb24">
                        <Message type="error">
                            <p>
                                NOTE: This signup/login flow for DataHub is only
                                for people who wants to temporarily try out
                                DataHub.
                            </p>
                            <p>
                                The user name and password (as salted hash)
                                information is only stored in the DataHub
                                Database and is not passed anywhere.
                            </p>
                            <p>
                                Please use OAuth or other login methods for
                                production usage.
                            </p>
                        </Message>
                    </div>

                    <Box>
                        <Tabs
                            align="center"
                            items={UNAUTH_TABS}
                            selectedTabKey={tabKey}
                            onSelect={this.handleTabChange}
                        />
                        {form}
                    </Box>
                </StyledUnauthPage>
            </Center>
        );
    }
}
