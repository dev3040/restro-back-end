export enum SocketEventEnum {
    SOCKET_CONNECTION_STATUS = 'socket_connection_status',
    ROOM_JOINED = 'room_joined',
    ROOM_LEFT = 'room_left',
    TICKET_DATA_UPDATE = "ticket_data_update",
    TICKET_DATA_ADD = "ticket_data_add",
    TICKET_DATA_REMOVE = "ticket_data_remove",
    ADD_COMMENT = 'add_comment',
    FORM_START = "form_start",
    FORM_DATA_UPDATE = "form_data_update", // For Activity Log
    FORM_DETAILS_UPDATE = "form_details_update", //Form Update via API
    ACTIVITY_LOG_UPDATE = "activity_log_update",
    LIST_ROOM_JOINED = 'list_room_joined',
    LIST_ROOM_LEFT = 'list_room_left',
    LIST_NEW_TICKET = 'list_new_ticket',
    NEW_BOOKMARK_CREATED = 'new_bookmark_created',
    BOOKMARK_DELETED = 'bookmark_deleted',
    MISSING_TICKET_DETAILS = 'missing_ticket_details',
    TICKET_ANALYTICS_EVENT = 'ticket_analytics_event',
    ACTIVITY_UPDATE = 'activity_update'
}
