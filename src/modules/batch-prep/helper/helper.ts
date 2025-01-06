import moment from "moment";
import { formatNegative } from "src/modules/forms-pdf/helper/helper";
import { BatchHistory } from "src/shared/entity/batch-history.entity";
import { getValue } from "src/shared/utility/common-function.methods";
import { throwException } from "src/shared/utility/throw-exception";

function generateColumn(data) {
    const reportTotalEstimationFees = calculateTotalEstimationFees(data);
    // batches in the data
    return data.map((batch) => {
        const countyName = getValue(batch?.countyName);
        const transactions = batch?.transactions || [];
        const processingDate = batch.processingDate ? moment(batch.processingDate).format('MM/DD/YYYY') : '';
        let ticketCount = 0;
        let totalEstimationFees = 0;
        //transactions and extract ticket information
        const transactionRows = transactions.map((transaction) => {
            const tickets = transaction.tickets || [];
            let isFirstTransactionType = true;
            //rows of each ticket
            ticketCount += tickets.length;
            const ticketRows = tickets.map((ticket) => {
                // estimation fees total
                const estimationFee = parseFloat(ticket?.estimationFees) || 0;
                totalEstimationFees += estimationFee;

                const transactionTypeRow = isFirstTransactionType
                    ? `<tr class="tableTitle-Inside text-center text-34 text-uppercase" >
                       <td colspan="6" class="p-1" style="border-bottom:0.5px solid #a9b4c8; border-top:0.5px solid #a9b4c8;">
                       <p style="font-weight:600;">${getValue(transaction?.transactionTypeName)}</p>
                       </td>
                   </tr>`
                    : '';

                isFirstTransactionType = false;
                return `
                   ${transactionTypeRow}
                    <tr class="text-center">
                        <td><p> ${getValue(ticket?.customerName)}_${getValue(ticket?.invoiceId)}</p></td>
                        <td><p>${getValue(ticket?.vinNumber)}</p></td> 
                        <td><p>${getValue(ticket?.runnerNote)}</p></td> 
                        <td><p>$${formatNegative(estimationFee.toFixed(2))}</p></td>
                        <td><p>${getValue(ticket?.checks)}</p></td>
                        <td><p></p></td>
                    </tr>
                `;
            }).join('');

            return ticketRows || "";
        }).join('');

        const mainHeader = generateHeader(countyName);
        const unitAndTotalEstimation = unitAndEstimationTotal(ticketCount, totalEstimationFees);
        // batch header
        const header = `
               ${mainHeader}
                <div class="details p-3 rounded-lg borderD0 mb-3 ">
                    <div class="table pb-3 text34">
                        <table>
                            <thead align="left">
                                <tr>
                                    <th class="pb-1"> <p>Processing Date</p></th>
                                    <th class="pb-1"> <p>County </p></th>
                                    <th class="pb-1"> <p>Runner's Name </p></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><p><b>${processingDate}</b></p></td>
                                    <td> <p><b>${getValue(countyName)}</b></p></td>
                                    <td><p><b></b></p></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="table text34">
                        <table>
                            <thead align="left">
                                <tr>
                                    <th class="pb-1"> <p>Estimated Total Amount</p></th>
                                    <th class="pb-1"> <p>Actual Total Amount</p></th>
                                    <th class="pb-1"></th>

                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td> <p><b>$${formatNegative(reportTotalEstimationFees.toFixed(2))}</p></b></td>
                                    <td><p></p></td>
                                    <td></td>

                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

        // comment
        const batchCommentSection = `
            <div class="notes p-3 mb-3 rounded-lg borderD0 bgF2F4" style="min-height:100px;">
                <div class="flex">
                    <div class="icon" style="width: 25px;">
                        <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.45898 12.0415L4.69606 10.7965C4.90311 10.7169 5.00663 10.677 5.10349 10.625C5.18952 10.5789 5.27153 10.5256 5.34867 10.4657C5.43552 10.3983 5.51395 10.3199 5.67081 10.163L12.2507 3.58319C12.895 2.93885 12.895 1.89418 12.2507 1.24985C11.6063 0.605519 10.5617 0.605518 9.91733 1.24985L3.33748 7.82969C3.18062 7.98655 3.10219 8.06498 3.0348 8.15183C2.97494 8.22897 2.92164 8.31098 2.87545 8.39702C2.82346 8.49387 2.78365 8.5974 2.70401 8.80445L1.45898 12.0415ZM1.45898 12.0415L2.65955 8.92008C2.74547 8.69671 2.78842 8.58502 2.8621 8.53387C2.92649 8.48916 3.00616 8.47225 3.08316 8.48695C3.17126 8.50378 3.25587 8.58839 3.4251 8.75762L4.7429 10.0754C4.91213 10.2446 4.99674 10.3293 5.01356 10.4174C5.02827 10.4944 5.01136 10.574 4.96665 10.6384C4.91549 10.7121 4.80381 10.7551 4.58044 10.841L1.45898 12.0415Z" stroke="#475467" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>                            
                    </div>
                    <div class="text text34" style="width: calc(100%-25px);">
                        <p>Note: ${getValue(batch?.comment)}</p>
                    </div>
                </div>
            </div>  `;

        //table details
        const detailsTable = `
                <div class="invoice-pdf">
                <div class="detailsTable table estimatedTable rounded-lg" style="overflow: hidden; border:0.5px solid #a9b4c8">
                    <table style="width:100%;">
                        <thead align="center" class="text-white bg-darkTable text-uppercase text-center">
                            <tr>
                                <th style="width: 15%;"> <p> <b>CUST_INV ID </b></p></th>
                                <th style="width: 18%;"> <p> <b>VIN </b></p></th>
                                <th style="width: 23%;"><p><b>COUNTY/ RUNNER NOTE </b></p></th>
                                <th style="width: 12.5%;"> <p><b>EST. FEES</b></p></th>
                                <th style="width: 12.5%;"> <p> <b>CHECKS#</b></p></th> 	
                                <th style="width: 16.5%;"> <p> <b>ACTUAL FEES</b></p></th> 	     
                            </tr>
                        </thead>
                        <tbody>
                            ${getValue(transactionRows)}
                             ${getValue(unitAndTotalEstimation)}
                        </tbody>
                    </table>
                </div>
                </div>`;

        //header, comment and details
        return `${header} ${batchCommentSection} ${detailsTable}`;
    })
        .join('<div class="page-break"></div>'); //batches page break
}

function generateHeader(countyName: string): string {
    if (!countyName) return "";
    return `
    <div class="pdfHeader" style="margin-bottom: 20px; background: white; width: 100%;">
        <div class="title" style="display: flex; justify-content: space-between; padding: 10px 20px;">
            <div class="leftPart">
                <div class="pdfDetail" style="display: flex; align-items: center;">
                    <div class="img" style="max-width:35px; margin-right: 10px;">
                        <img src="https://tags-and-titles-assets.oneclicksales.xyz/t&t-logo.webp" alt="Logo"
                            style="width: auto; height: auto; max-width: 100%;">
                    </div>
                    <h1 style="font-size:20px;">Tags & Titles</h1>
                </div>
                <div style="margin-left: 50px;">
                    <p class='pb-1' style="font-size: 14px; line-height: 12px;">titles@tagstitles.com</p>
                    <p style="font-size: 14px; line-height: 12px;">renewals@tagstitles.com</p>
                </div>
            </div>
            <div class="right_part" style="text-align: right;">
                <div class="w-full" >
                    <p class="pdfNo" style="font-size: 20px; font-weight: bold;">${countyName} County Report</p>
                </div>
            </div>
        </div>
    </div>
    `;
}

function unitAndEstimationTotal(ticketCount, totalEstimationFees) {
    return ` 
    <tr class="tableTitle-Inside text-34 text-uppercase">
     <td colspan="3" class="p-1" style="border-top:0.5px solid #a9b4c8;">
         <p><b>Total: ${getValue(ticketCount)} Units </b></p>
     </td>
     <td colspan="3" class="p-1" style="border-top:0.5px solid #a9b4c8;">
         <p style="padding-left:20px;"><b>$${getValue(totalEstimationFees?.toFixed(2))}</b></p>
     </td>
 </tr>`
}

async function updateBatchHistory(batchIds, fileName: string | null, status: number): Promise<void> {
    try {
        await BatchHistory.create({
            batchIds,
            fileName,
            status,
            generatedDate: new Date()
        }).save();

    } catch (error) {
        throwException(error);
    }
}

function calculateTotalEstimationFees(data) {
    return data.reduce((total, batch) => {
        const batchTotal = (batch?.transactions || []).reduce((transactionTotal, transaction) => {
            const ticketTotal = (transaction?.tickets || []).reduce((ticketTotal, ticket) => {
                return ticketTotal + (parseFloat(ticket?.estimationFees) || 0);
            }, 0);
            return transactionTotal + ticketTotal;
        }, 0);
        return total + batchTotal;
    }, 0);
}

export { generateColumn, generateHeader, updateBatchHistory } 