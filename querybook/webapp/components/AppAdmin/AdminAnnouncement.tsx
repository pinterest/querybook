import React from 'react';
import * as Yup from 'yup';

import ds from 'lib/datasource';
import { getQueryString } from 'lib/utils/query-string';
import { useDataFetch } from 'hooks/useDataFetch';

import { Card } from 'ui/Card/Card';
import { Icon } from 'ui/Icon/Icon';
import { GenericCRUD } from 'ui/GenericCRUD/GenericCRUD';
import { Loading } from 'ui/Loading/Loading';
import { SimpleField } from 'ui/FormikField/SimpleField';

import './AdminAnnouncement.scss';
import { AdminAuditLogButton } from 'components/AdminAuditLog/AdminAuditLogButton';
import { Level } from 'ui/Level/Level';

const announcementSchema = Yup.object().shape({
    url_regex: Yup.string().min(0),
    message: Yup.string().min(1).max(500),
    can_dismiss: Yup.bool(),
});

interface IAdminAnnouncement {
    id: number;
    created_at: number;
    updated_at: number;
    message: string;
    uid: number;
    url_regex: string;
    can_dismiss: boolean;
}

export const AdminAnnouncement: React.FunctionComponent = () => {
    const {
        data: announcements,
        forceFetch: loadAnnouncements,
    }: { data: IAdminAnnouncement[]; forceFetch } = useDataFetch({
        url: '/admin/announcement/',
    });
    const [displayNewForm, setDisplayNewForm] = React.useState<boolean>(
        () => getQueryString()['new'] === 'true'
    );

    React.useEffect(() => {
        loadAnnouncements();
    }, []);

    const createAnnouncement = React.useCallback(
        async (announcement: IAdminAnnouncement) => {
            setDisplayNewForm(false);
            const { data } = await ds.save(`/admin/announcement/`, {
                message: announcement.message,
                url_regex: announcement.url_regex,
                can_dismiss: announcement.can_dismiss,
            });
            return data as IAdminAnnouncement;
        },
        []
    );

    const saveAnnouncement = React.useCallback(
        (id: number) => async (announcement: Partial<IAdminAnnouncement>) => {
            const { data } = await ds.update(
                `/admin/announcement/${id}/`,
                announcement
            );
            return data as IAdminAnnouncement;
        },
        []
    );

    const deleteAnnouncement = React.useCallback(
        (announcement: IAdminAnnouncement) =>
            ds.delete(`/admin/announcement/${announcement.id}/`),
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
                </div>
                <div className="AdminForm-right">
                    <SimpleField
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
                        <Icon name="plus" />
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
