import React from 'react';
import { useSelector } from 'react-redux';
import { Route, Switch, useParams } from 'react-router-dom';

import { AdminAppEntitySidebar } from 'components/AdminAppSidebar/AdminAppEntitySidebar';
import { AdminAppNavigator } from 'components/AdminAppSidebar/AdminAppNavigator';
import { TaskStatus } from 'components/Task/TaskStatus';
import { useResource } from 'hooks/useResource';
import history from 'lib/router-history';
import { getAppName } from 'lib/utils/global';
import { IStoreState } from 'redux/store/types';
import {
    AdminEnvironmentResource,
    AdminMetastoreResource,
    AdminQueryEngineResource,
} from 'resource/admin';
import { Card } from 'ui/Card/Card';
import { FourOhThree } from 'ui/ErrorPage/FourOhThree';
import { Icon } from 'ui/Icon/Icon';
import { Sidebar } from 'ui/Sidebar/Sidebar';

import { AdminAnnouncement } from './AdminAnnouncement';
import { AdminApiAccessToken } from './AdminApiAccessToken';
import { AdminConfig } from './AdminConfig';
import { AdminEnvironment } from './AdminEnvironment';
import { AdminMetastore } from './AdminMetastore';
import { AdminQueryEngine } from './AdminQueryEngine';
import { AdminTask } from './AdminTask';
import { AdminUserRole } from './AdminUserRole';
import { AdminEntity } from './types';

import './AppAdmin.scss';

const ENTITY_SIDEBAR_WIDTH = 200;
const NAV_SIDEBAR_WIDTH = 260;

const AppAdmin: React.FunctionComponent = () => {
    const { entity: selectedEntity }: { entity: AdminEntity } = useParams();

    const { data: environments, forceFetch: loadEnvironments } = useResource(
        AdminEnvironmentResource.getAll
    );
    const { data: metastores, forceFetch: loadMetastores } = useResource(
        AdminMetastoreResource.getAll
    );
    const { data: queryEngines, forceFetch: loadQueryEngines } = useResource(
        AdminQueryEngineResource.getAll
    );

    const isAdmin = useSelector(
        (state: IStoreState) => state.user.myUserInfo.isAdmin
    );

    const entityList = React.useMemo(() => {
        const entityData =
            selectedEntity === 'environment'
                ? (environments || []).map((env) => ({
                      id: env.id,
                      name: env.name,
                      deleted: env.deleted_at !== null,
                  }))
                : selectedEntity === 'metastore'
                ? (metastores || []).map((metastore) => ({
                      id: metastore.id,
                      name: metastore.name,
                      deleted: metastore.deleted_at !== null,
                      searchField: metastore.loader,
                  }))
                : selectedEntity === 'query_engine'
                ? (queryEngines || []).map((engine) => ({
                      id: engine.id,
                      name: engine.name,
                      deleted: engine.deleted_at !== null,
                      searchField: engine.language,
                  }))
                : null;
        return entityData;
    }, [selectedEntity, environments, metastores, queryEngines]);

    React.useEffect(() => {
        loadSelectedEntity();
    }, [selectedEntity]);

    const loadSelectedEntity = React.useCallback(
        async (entity = selectedEntity) => {
            switch (entity) {
                case 'environment': {
                    loadEnvironments();
                    break;
                }
                case 'metastore': {
                    loadMetastores();
                    break;
                }
                case 'query_engine': {
                    loadQueryEngines();
                    break;
                }
                default: {
                    return;
                }
            }
        },
        [selectedEntity]
    );

    const handleEntitySelect = React.useCallback((key: AdminEntity) => {
        history.push(`/admin/${key}/`);
    }, []);

    const hasNavigator = React.useMemo(
        () =>
            ['environment', 'metastore', 'query_engine'].includes(
                selectedEntity
            ),
        [selectedEntity]
    );

    const makeLandingPageDOM = () => (
        <div className="AdminLanding">
            <div className="AdminLanding-top">
                <div className="AdminLanding-title">
                    Welcome to the {getAppName()} Admin App
                </div>
                <div className="AdminLanding-desc">
                    All your settings are here.
                </div>
            </div>
            <div className="AdminLanding-content">
                <div className="AdminLanding-cards flex-row">
                    <Card
                        title={<Icon name="Box" />}
                        onClick={() => history.push('/admin/environment/new/')}
                        height="160px"
                        width="240px"
                    >
                        create a new environment
                    </Card>
                    <Card
                        title={<Icon name="Database" />}
                        onClick={() => history.push('/admin/metastore/new/')}
                        height="160px"
                        width="240px"
                    >
                        create a new metastore
                    </Card>
                    <Card
                        title={<Icon name="Server" />}
                        onClick={() => history.push('/admin/query_engine/new/')}
                        height="160px"
                        width="240px"
                    >
                        create a new query engine
                    </Card>
                    <Card
                        title={<Icon name="Users" />}
                        onClick={() =>
                            history.push('/admin/user_role/?new=true/')
                        }
                        height="160px"
                        width="240px"
                    >
                        create a new user role
                    </Card>
                    <Card
                        title={<Icon name="Clipboard" />}
                        onClick={() =>
                            history.push('/admin/announcement/?new=true/')
                        }
                        height="160px"
                        width="240px"
                    >
                        create a new announcement
                    </Card>
                </div>
            </div>
        </div>
    );

    return isAdmin ? (
        <div className="AppAdmin">
            <Sidebar
                className="AdminAppSidebar"
                initialWidth={ENTITY_SIDEBAR_WIDTH}
                minWidth={ENTITY_SIDEBAR_WIDTH}
            >
                <AdminAppEntitySidebar
                    selectedEntity={selectedEntity}
                    onSelectEntity={handleEntitySelect}
                />
            </Sidebar>
            {hasNavigator ? (
                <Sidebar
                    className="AdminAppSidebar"
                    initialWidth={NAV_SIDEBAR_WIDTH}
                    minWidth={NAV_SIDEBAR_WIDTH}
                >
                    <AdminAppNavigator
                        selectedEntity={selectedEntity}
                        entityList={entityList}
                        placeholder={
                            selectedEntity === 'metastore'
                                ? 'Filter by name and loader'
                                : selectedEntity === 'query_engine'
                                ? 'Filter by name and language'
                                : 'Filter by name'
                        }
                    />
                </Sidebar>
            ) : null}
            <div className="AppAdmin-content">
                <Switch>
                    <Route exact path="/admin/" render={makeLandingPageDOM} />
                    <Route
                        path="/admin/environment/:id?"
                        render={() => (
                            <AdminEnvironment
                                environments={environments}
                                queryEngines={queryEngines}
                                loadEnvironments={loadEnvironments}
                                loadQueryEngines={loadQueryEngines}
                            />
                        )}
                    />
                    <Route
                        path="/admin/metastore/:id?"
                        render={() => (
                            <AdminMetastore
                                metastores={metastores}
                                loadMetastores={loadMetastores}
                            />
                        )}
                    />
                    <Route
                        path="/admin/query_engine/:id?"
                        render={() => (
                            <AdminQueryEngine
                                queryEngines={queryEngines}
                                metastores={metastores}
                                loadQueryEngines={loadQueryEngines}
                                loadMetastores={loadMetastores}
                            />
                        )}
                    />
                    <Route path="/admin/task/:id?" component={AdminTask} />
                    <Route
                        path="/admin/task_status/"
                        component={AdminTaskStatus}
                    />
                    <Route path="/admin/user_role/" component={AdminUserRole} />
                    <Route
                        path="/admin/api_access_token/"
                        component={AdminApiAccessToken}
                    />
                    <Route
                        path="/admin/announcement/"
                        component={AdminAnnouncement}
                    />
                    <Route path="/admin/config/" component={AdminConfig} />
                    <Route component={FourOhThree} />
                </Switch>
            </div>
        </div>
    ) : (
        <FourOhThree />
    );
};

const AdminTaskStatus: React.FC = () => (
    <div className="AdminTaskStatus">
        <div className="AdminLanding-top">
            <div className="AdminLanding-title">Job Status</div>
            <div className="AdminLanding-desc">
                Update job schedule at a metastore setting or in a data doc.
            </div>
        </div>
        <TaskStatus />
    </div>
);

export default AppAdmin;
