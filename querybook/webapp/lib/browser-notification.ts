function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.error('This browser does not support desktop notification');
        return;
    } else if (Notification.permission === 'granted') {
        return;
    } else {
        Notification.requestPermission();
    }
}

export function pushNotification(title: string, body: string) {
    requestNotificationPermission();
    new Notification(title, {
        body,
        icon: '/static/favicon/querybook.svg',
    });
}
