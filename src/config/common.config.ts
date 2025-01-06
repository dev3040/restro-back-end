export const errorMessage = `Oops. Something went wrong. Please try again.`;
export const documentPath = `assets/uploads`;
export const fmvDocumentPath = `assets/uploads/fmvs`;
export const batchDocuments = `assets/uploads/batch-prep`;
export const plateDocumentPath = `assets/uploads/plate`;
export const highwayImpact50 = 50;
export const highwayImpact100 = 100;
export const valoremTacPenalty = 10;
export const minActivityCommentsLimit = 5;
export const hireAndNotForHire = ["NFH", "FH"];
export const PG_UNIQUE_VIOLATION = 23505; // Unique constraint violation
export const fedExReturnPath = (ticketId) => (`${documentPath}/${ticketId}/fedEx`);
export const fedExBatchPath = (batchId) => (`${documentPath}/batch/${batchId}/fedEx`);
