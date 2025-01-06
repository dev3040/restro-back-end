//Filter Bookmark
export const FilterBookmarkConst = {
    nameLength: 50,
}

//Common 
export const CommonConst = {
    maxStringLength: 50,
    minStringLength: 2,
    slugLength: 50,
    yearLength: 4,
    monthLength: 2,
}

//Transaction types
export const TransactionTypeConst = {
    stateLength: 100,
    nameLength: 300,
    codeLength: 50
}

//Slug constants
export const SlugConstants = {
    //ticket status
    ticketStatusInprogress: 'in_process',
    ticketStatusOpenReceivedReq: 'new_task',
    ticketStatusSentToDmv: 'sent_to_dmv',
    ticketStatusQuote: 'quote',
    ticketStatusReadyForBatchPrep: 'ready_for_batch_prep',
    ticketBatchAssigned: 'batch_assigned',

    //priority
    priorityHigh: 'high'
}

//Task list : Group by
export const GeneralConst = {
    groupByNoPriority: 'No Priority'
}

//chunk constants
export const ChunkConst = {
    cusTranMapping: 2000
}

//regex contants
export const RegexConst = {
    checkOnlyNumericValue: /^\d+$/
}