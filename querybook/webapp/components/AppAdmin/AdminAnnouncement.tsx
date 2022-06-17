import React from 'react';
import styled from 'styled-components';
import * as Yup from 'yup';

import { AdminAuditLogButton } from 'components/AdminAuditLog/AdminAuditLogButton';
import { IAdminAnnouncement } from 'const/admin';
import { useResource } from 'hooks/useResource';
import { getQueryString } from 'lib/utils/query-string';
import {
    AdminAnnouncementResource,
    AdminEnvironmentResource,
} from 'resource/admin';
import { Card } from 'ui/Card/Card';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { GenericCRUD } from 'ui/GenericCRUD/GenericCRUD';
import { Icon } from 'ui/Icon/Icon';
import { Level } from 'ui/Level/Level';
import { Loading } from 'ui/Loading/Loading';

import { EnvironmentSelection } from './components/EnvironmentSelection/EnvironmentSelection';

import './AdminAnnouncement.scss';

const announcementSchema = Yup.object().shape({
    url_regex: Yup.string().min(0),
    message: Yup.string().min(1).max(500),
    can_dismiss: Yup.bool(),
});

const StyledDateWrapper = styled.div`
    flex-grow: 1;
    text-align: left;
    display: flex;
    max-width: calc(100% - 180px);
    .FormField {
        margin-right: 16px;
    }
`;

export const AdminAnnouncement: React.FunctionComponent = () => {
    const { data: environments } = useResource(AdminEnvironmentResource.getAll);

    const { data: announcements, forceFetch: loadAnnouncements } = useResource(
        AdminAnnouncementResource.getAll
    );
    const [displayNewForm, setDisplayNewForm] = React.useState<boolean>(
        () => getQueryString()['new'] === 'true'
    );

    React.useEffect(() => {
        loadAnnouncements();
    }, []);

    const createAnnouncement = React.useCallback(
        async (announcement: IAdminAnnouncement) => {
            setDisplayNewForm(false);
            const { data } = await AdminAnnouncementResource.create(
                announcement.message,
                announcement.url_regex,
                announcement.can_dismiss,
                announcement.active_from,
                announcement.active_till
            );
            return data;
        },
        []
    );

    const saveAnnouncement = React.useCallback(
        (id: number) => async (announcement: Partial<IAdminAnnouncement>) => {
            const { data } = await AdminAnnouncementResource.update(
                id,
                announcement
            );
            return data;
        },
        []
    );

    const deleteAnnouncement = React.useCallback(
        (announcement: IAdminAnnouncement) =>
            AdminAnnouncementResource.delete(announcement.id),
        []
    );

    const renderAnnouncementItem = () => (
        <div className="AdminForm">
            <div className="AdminForm-main">
                <div className="AdminForm-left">
                    <SimpleField
                        stacked
                        name="message"
                        type="textarea"
                        placeholder="Announcements can be written in markdown format."
                    />
                    <SimpleField
                        stacked
                        name="url_regex"
                        type="input"
                        help={
                            'You can specify the url in which the announcement will be shown. ' +
                            'Try using an environment name to announce to a specific environment ' +
                            " (ex. '/default/')"
                        }
                    />
                    <EnvironmentSelection
                        name="environment"
                        label="Environment"
                        options={[
                            { value: '', key: '', hidden: true },
                            ...(environments || []).map(({ name }) => ({
                                value: name,
                                key: name,
                            })),
                        ]}
                    />
                    <StyledDateWrapper>
                        <SimpleField
                            stacked
                            type="datepicker"
                            label="Active From"
                            name="active_from"
                        />
                        <SimpleField
                            stacked
                            type="datepicker"
                            label="Till"
                            name="active_till"
                        />
                    </StyledDateWrapper>
                </div>
                <div className="AdminForm-right">
                    <SimpleField
                        stacked
                        name="can_dismiss"
                        type="toggle"
                        help="Enabling will allow users to dismiss the announcement"
                    />
                </div>
            </div>
        </div>
    );

    const getCardDOM = () =>
        announcements.map((ann) => (
            <Card key={ann.id} title="" width="100%" flexRow>
                <GenericCRUD
                    item={ann}
                    deleteItem={deleteAnnouncement}
                    updateItem={saveAnnouncement(ann.id)}
                    validationSchema={announcementSchema}
                    renderItem={renderAnnouncementItem}
                    onItemCUD={loadAnnouncements}
                />
            </Card>
        ));

    const getNewFormDOM = () => {
        if (displayNewForm) {
            return (
                <div className="AdminAnnouncement-new-form horizontal-space-between">
                    <GenericCRUD<Partial<IAdminAnnouncement>>
                        item={{
                            message: undefined,
                            url_regex: undefined,
                            can_dismiss: false,
                        }}
                        createItem={createAnnouncement}
                        deleteItem={() => setDisplayNewForm(false)}
                        renderItem={renderAnnouncementItem}
                        onItemCUD={loadAnnouncements}
                    />
                </div>
            );
        } else {
            return (
                <Card
                    title=""
                    width="100%"
                    flexRow
                    onClick={() => {
                        setDisplayNewForm(true);
                    }}
                >
                    <div className="AdminAnnouncement-new-msg flex-row">
                        <Icon name="Plus" />
                        <span>create a new announcement</span>
                    </div>
                </Card>
            );
        }
    };

    return (
        <div className="AdminAnnouncement">
            <div className="AdminLanding-top">
                <Level>
                    <div className="AdminLanding-title">Announcements</div>
                    <AdminAuditLogButton itemType={'announcement'} />
                </Level>

                <div className="AdminLanding-desc">
                    Make an app-wide or an environment-specific announcement.
                </div>
            </div>
            <div className="AdminAnnouncement-content">
                <div className="AdminAnnouncement-new">{getNewFormDOM()}</div>
                <div className="AdminAnnouncement-list flex-column">
                    {announcements ? getCardDOM() : <Loading />}
                </div>
            </div>
        </div>
    );
};
