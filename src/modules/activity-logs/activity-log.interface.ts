import { ActivityLogActionType } from "src/shared/enums/activity-action-type.enum";
import { DataEntryFormType } from "src/shared/enums/form-type.enum";

export interface ActivityLogPayload {
   userId: number | null;
   actionType: ActivityLogActionType,
   ticketId: number;
   fieldName: string | null;
   newData: string | null;
   oldData: string | null;
   formType: DataEntryFormType | null
}