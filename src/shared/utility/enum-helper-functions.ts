import { ActivityTypesEnum } from "../enums/activity-type.enum";
import { BatchGroupByEnum } from "../enums/batch-group-by.enum";
import { BatchHistoryPdfStatus } from "../enums/batch-history.enum";
import { TicketTypes } from "../enums/county-location.enum";
import { OrderDir } from "../enums/order-dir.enum";
import { TaskGroupByEnum } from "../enums/task-group-by.enum";
import { TicketOrderByEnum } from "../enums/ticket-order-by.enum";

//task group by
function taskGroupByEnumValues() {
   const taskGroupByEnumValues = Object.keys(TaskGroupByEnum)
      .filter(key => isNaN(Number(TaskGroupByEnum[key])))
      .map(key => `${key}:${(TaskGroupByEnum[key])}`)
      .join(', ');
   return taskGroupByEnumValues
}

//task order by fields
function taskOrderByFieldsEnumValues() {
   const taskGroupByEnumValues = Object.keys(TicketOrderByEnum)
      .map(key => `${(TicketOrderByEnum[key])}`)
      .join(', ');
   return taskGroupByEnumValues
}

//order  by [asc/desc]
function orderByEnumValues() {
   const taskGroupByEnumValues = Object.keys(OrderDir)
      .map(key => `${(OrderDir[key])}`)
      .join(', ');
   return taskGroupByEnumValues
}

//ticket type 
function ticketTypesEnumValues(excludeAll?: boolean) {
   return Object.entries(TicketTypes)
      .filter(([key, value]) =>
         typeof value === 'number' && (!excludeAll && key !== 'ALL')
      )
      .map(([key, value]) => `${value}:${key}`)
      .join(', ');
}
//batch group by
function batchGroupByEnumValues() {
   const values = Object.keys(BatchGroupByEnum)
      .map(key => `${(BatchGroupByEnum[key])}`)
      .join(', ');
   return values
}

//pdf history status
function pdfHistoryStatusEnumValues() {
   const taskGroupByEnumValues = Object.keys(BatchHistoryPdfStatus)
      .filter(key => isNaN(Number(BatchHistoryPdfStatus[key])))
      .map(key => `${key}:${(BatchHistoryPdfStatus[key])}`)
      .join(', ');
   return taskGroupByEnumValues

}

//activity type 
function activityTypeEnumValues() {
   const activityTypeValues = Object.keys(ActivityTypesEnum)
      .filter(key => isNaN(Number(ActivityTypesEnum[key])))
      .map(key => `${key}:${(ActivityTypesEnum[key])}`)
      .join(', ');
   return activityTypeValues
}

export { taskGroupByEnumValues, taskOrderByFieldsEnumValues, orderByEnumValues, ticketTypesEnumValues, pdfHistoryStatusEnumValues, batchGroupByEnumValues, activityTypeEnumValues }


