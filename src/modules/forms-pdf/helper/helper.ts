import { getValue } from "src/shared/utility/common-function.methods";

function generateLesseeInfo(lessees) {
    if (lessees?.[0]?.secFirstName || lessees?.[0]?.secLastName || lessees?.[0]?.secondaryName) {
        return `
            <div style="width:100%;">
                <p>
                  <span style='color:#000;'> | &nbsp; </span> <span>${lessees?.[0]?.secFirstName ? lessees?.[0]?.secFirstName.toUpperCase() : ""}</span>
                  <span>${lessees?.[0]?.secLastName ? lessees?.[0]?.secLastName?.toUpperCase() : ""}</span>
                  <span>${lessees?.[0]?.secondaryName ? lessees?.[0]?.secondaryName?.toUpperCase() : ""}</span>
                </p>
                ${lessees?.[0]?.secAddress ? `<div style="display:flex; flex-wrap:wrap;"> 
                <span style='color:#000; width:10px;'> | </span>  
                <p style="width:calc(100% - 12px);"> 
                    <span style="font-size: ${lessees?.[0]?.secAddress?.length > 45 ? '8px' : 'inherit'};">
                        ${lessees?.[0]?.secAddress ? lessees?.[0]?.secAddress?.toUpperCase() : ""}
                    </span>
                </p>
            </div>` : ''}
            </div>`;
    }
    return '';
}

function generateOdometerCode(odometerCode) {
    const code = getValue(odometerCode);
    if (code === 'exempt') {
        return '<span class="absolute checkbox checked" style="left:159px;"></span>';
    } else if (code === 'exceeds_mechanical_limits') {
        return '<span class="absolute checkbox checked" style="left:232px;"></span>';
    } else if (code === 'not_actual_milage') {
        return '<span class="absolute checkbox checked" style="left:470px;"></span>';
    } else {
        return '';
    }
}

function generateNoOfOwners(owner, lessors) {
    const countOwner = owner?.[0] ? (owner[0].secFirstName || owner[0].secondaryName ? 2 : 1) : 0;
    const countLessor = lessors?.[0] ? (lessors[0].secFirstName || lessors[0].secondaryName ? 2 : 1) : 0;
    return (countOwner + countLessor).toString();
}

function formatCustomerIdMv1s(inputString, length = 12) {
    const formattedString = (inputString || '').padEnd(length).split('');
    return formattedString
        .map(char => `<p style="width: 18px;">${char.trim()}</p>`)
        .join('');
}

function formatClientAndUnit(client, unit) {
    const clientTag = client ? `<span>&lt;${client}${unit ? '' : '&gt;'}</span>` : '';
    const separator = client && unit ? ' - ' : '';
    const unitTag = unit ? `<span>${client ? '' : '&lt;'}${unit}&gt;</span>` : '';
    return clientTag + separator + unitTag;
}

function formatInvoiceAndCustomer(invoiceId, shortName) {
    const invoiceTag = invoiceId ? `<span>&lt;${invoiceId}${shortName ? '' : '&gt;'}</span>` : '';
    const customerTag = shortName ? `<span>${invoiceId ? '' : '&lt;'}${shortName}&gt;</span>` : '';
    return invoiceTag && customerTag ? `${invoiceTag} - ${customerTag}` : invoiceTag || customerTag;
}

function formatStamps(stamps, addOnStamps) {
    const joinStamps = (stampArray) =>
        stampArray
            .map(stamp => getValue(stamp?.stamp))
            .filter(Boolean)
            .join(', ');
    const stampString = joinStamps(stamps);
    const addOnStampString = joinStamps(addOnStamps);
    return [stampString, addOnStampString].filter(Boolean).join(' | ');
}

function assignDollarValue(value) {
    if (value !== null && value !== undefined && value !== "") {
        return `$${value}`;
    }
    return "";
}

function formatStringToHTML(value, length, tag, style = '') {
    return value
        .padEnd(length)
        .split('')
        .map(char => `<${tag} style="${style}">${char.trim()}</${tag}>`) // tag style
        .join('');
}

//lien Checkbox (Yes/No SVG)
function renderLien(hasLien: any) {
    const lienCheck = hasLien ? `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.442308" y="0.442308" width="15.1154" height="15.1154" rx="4.86539" fill="white" />
            <rect x="0.442308" y="0.442308" width="15.1154" height="15.1154" rx="4.86539" stroke="#0171AD" stroke-width="0.884615" />
            <path d="M11.7338 5.2002L6.60042 10.3335L4.26709 8.0002" stroke="#0171AD" stroke-width="1.76923" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>Yes</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.442308" y="0.442308" width="15.1154" height="15.1154" rx="4.86539" fill="white" />
            <rect x="0.442308" y="0.442308" width="15.1154" height="15.1154" rx="4.86539" stroke="#D0D5DD" stroke-width="0.884615" />
        </svg>
        <span>No</span>
    ` : `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.442308" y="0.442308" width="15.1154" height="15.1154" rx="4.86539" fill="white" />
            <rect x="0.442308" y="0.442308" width="15.1154" height="15.1154" rx="4.86539" stroke="#D0D5DD" stroke-width="0.884615" />
            </svg>
         <span>Yes</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.442308" y="0.442308" width="15.1154" height="15.1154" rx="4.86539" fill="white" />
            <rect x="0.442308" y="0.442308" width="15.1154" height="15.1154" rx="4.86539" stroke="#0171AD" stroke-width="0.884615" />
            <path d="M11.7338 5.2002L6.60042 10.3335L4.26709 8.0002" stroke="#0171AD" stroke-width="1.76923" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>No</span>
    `;

    return lienCheck;

}
function renderLienDetails(hasLien: any) {
    const lien = hasLien.length > 0 ? `
    <div class="information" style="width:50%;">
        <h2>Lien Holder 1</h2>
        <div class="name">
            <p class="vehicleIdentify">Name</p>
            <div class="min-h-text">
                <p class="vehicleIdentifier">
                    <span>${hasLien[0]?.firstName ? hasLien[0].firstName.toUpperCase() : ''}</span>
                    <span>${hasLien[0]?.middleName ? hasLien[0].middleName.toUpperCase() : ''}</span>
                    <span>${hasLien[0]?.lastName ? hasLien[0].lastName.toUpperCase() : ''}</span>
                    <span>${hasLien[0]?.holderName ? hasLien[0].holderName.toUpperCase() : ''}</span>
                </p>
            </div>
        </div>
        <div class="address">
            <p class="vehicleIdentify">Address</p>
            <div class="min-h-text">
                <p class="vehicleIdentifier">${hasLien[0]?.address ? hasLien[0].address.toUpperCase() : ''}</p>
            </div>
        </div>
        ${hasLien[0]?.lien?.lienHolderId ? `
        <div class="mailingAddress">
            <p class="vehicleIdentify">ELT No.</p>
            <div class="min-h-text">
                <p class="vehicleIdentifier">${hasLien[0]?.lien?.lienHolderId}</p>
            </div>
        </div>
        ` : ''}
    </div>
` : '';
    const secondLien = hasLien[1] ? `
<div class="information" style="width:50%;" >
    <h2>Lien Holder 2</h2>
    <div class="name">
        <p class="vehicleIdentify">Name</p>
        <div class="min-h-text">
            <p class="vehicleIdentifier">
                <span>${hasLien[1]?.firstName ? hasLien[1].firstName.toUpperCase() : ''}</span>
                <span>${hasLien[1]?.middleName ? hasLien[1].middleName.toUpperCase() : ''}</span>
                <span>${hasLien[1]?.lastName ? hasLien[1].lastName.toUpperCase() : ''}</span>
                <span>${hasLien[1]?.holderName ? hasLien[1].holderName.toUpperCase() : ''}</span>
            </p>
        </div>
    </div>
    <div class="address">
        <p class="vehicleIdentify">Address</p>
        <div class="min-h-text">
            <p class="vehicleIdentifier">${hasLien[1]?.address ? hasLien[1].address.toUpperCase() : ''}</p>
        </div>
    </div>
    ${hasLien[1]?.lien?.lienHolderId ? `
    <div class="mailingAddress">
        <p class="vehicleIdentify">ELT No.</p>
        <div class="min-h-text">
            <p class="vehicleIdentifier">${hasLien[1]?.lien?.lienHolderId}</p>
        </div>
    </div>
    ` : ''}
</div>
` : '';
    return lien + secondLien;
}

function sumOfValues(...values) {
    const sum = values.reduce((total, currentValue) => {
        if (currentValue !== undefined && currentValue !== null && currentValue !== "") {
            const numericValue = parseFloat(currentValue.toString().replace(/,/g, ''));
            return total + numericValue;
        }
        return total;
    }, 0);
    return sum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function subtractValues(...values) {
    const result = values.reduce((total, currentValue, index) => {
        if (currentValue !== undefined && currentValue !== null && currentValue !== "") {
            return index === 0 ? parseFloat(currentValue) : total - parseFloat(currentValue);
        }
        return total;
    }, 0);

    if (result < 0) {
        return `(${Math.abs(result).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    } else {
        return result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

function generateDynamicHTMLRow({
    label = null,
    percentage = null,
    value = null,
    trTag = "tr",
    tdTag = "td",
    additionalTdContent = ["", "", ""]
} = {}) {

    if (!percentage && !value) return "";
    let percentageContent = "";
    if (percentage !== null) {
        percentageContent = `&lt;<span>${percentage}%</span>&gt;`;
    }

    return `
        <${trTag}>
            <${tdTag}>
                ${label ? `${label} ${percentageContent}` : ''}
            </${tdTag}>
            <${tdTag}>
                ${value !== null ? `${assignDollarValue(value)}` : ''}
            </${tdTag}>
            ${additionalTdContent.map(content => `<${tdTag}>${content || ''}</${tdTag}>`).join('')}
        </${trTag}>
    `;
}

function calculateTotalTaxableValue({
    salesPrice = 0,
    discount = 0,
    rebates = 0,
    tradeInAllowances = []
}: { salesPrice?: string | number, discount?: string | number, rebates?: string | number, tradeInAllowances?: (string | number)[] } = {}) {
    const parsedSalesPrice = Number((salesPrice ?? 0).toString().replace(/,/g, ''));
    const parsedDiscount = Number((discount ?? 0).toString().replace(/,/g, ''));
    const parsedRebates = Number((rebates ?? 0).toString().replace(/,/g, ''));

    let total = parsedSalesPrice - parsedDiscount - parsedRebates;

    tradeInAllowances.forEach(allowance => {
        total -= Number((allowance ?? 0).toString().replace(/,/g, ''));
    });
    if (total < 0) {
        return `(${Math.abs(total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    } else {
        return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

function sumAdditionalFees(data: any): string {
    const total: any = Object.values(data)
        .flat()
        .reduce((sum, item: any) => {
            if (typeof item === 'object' && item?.type === 'add' && item !== data.salesPrice) {
                return sum + (item.val || 0);
            }
            return sum;
        }, 0);
    if (total < 0) {
        return `(${Math.abs(total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    } else {
        return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

function generateLesseeRender(formsData) {
    if (Array.isArray(formsData?.lessees) && formsData.lessees.length !== 0) {
        let lessee2Info = '';

        lessee2Info = `
            <div class="information">
                <h2>Lessee 2</h2>
                <div class="name">
                    <p class="vehicleIdentify">Name</p>
                    <div class="min-h-text">
                        <p class="vehicleIdentifier">
                            <span>${getValue(formsData?.lessees[0]?.secFirstName).toUpperCase()}</span>
                            <span>${getValue(formsData?.lessees[0]?.secMiddleName).toUpperCase()}</span>
                            <span>${getValue(formsData?.lessees[0]?.secLastName).toUpperCase()}</span>
                            <span>${getValue(formsData?.lessees[0]?.secondaryName).toUpperCase()}</span>
                        </p>
                    </div>
                </div>
                <div class="fien">
                    <p class="vehicleIdentify">FEIN</p>
                    <div class="min-h-text">
                        <p class="vehicleIdentifier"></p>
                    </div>
                </div>
                <div class="address">
                    <p class="vehicleIdentify">Address</p>
                    <div class="min-h-text">
                        <p class="vehicleIdentifier">${getValue(formsData?.lessees[0]?.secAddress).toUpperCase()}</p>
                    </div>
                </div>
                <div class="mailingAddress">
                    <p class="vehicleIdentify">Mailing Address</p>
                    <div class="min-h-text">
                        <p class="vehicleIdentifier">${getValue(formsData?.lessees[0]?.secMailingAddress).toUpperCase()}</p>
                    </div>
                </div>
              
            </div>`;

        return `
        <div class="ownerLessorInfo">
            <div class="information">
                <h2>Lessee 1</h2>
                <div class="name">
                    <p class="vehicleIdentify"> Name</p>
                    <div class="min-h-text">
                        <p class="vehicleIdentifier">
                            <span>${getValue(formsData?.lessees[0]?.firstName).toUpperCase()}</span>
                            <span>${getValue(formsData?.lessees[0]?.middleName).toUpperCase()}</span>
                            <span>${getValue(formsData?.lessees[0]?.lastName).toUpperCase()}</span>
                            <span>${getValue(formsData?.lessees[0]?.name).toUpperCase()}</span>
                        </p>
                    </div>
                </div>
                <div class="fien">
                    <p class="vehicleIdentify">FEIN</p>
                    <div class="min-h-text">
                        <p class="vehicleIdentifier"></p>
                    </div>
                </div>
                <div class="address">
                    <p class="vehicleIdentify">Address</p>
                    <div class="min-h-text">
                        <p class="vehicleIdentifier">${getValue(formsData?.lessees[0]?.address).toUpperCase()}</p>
                    </div>
                </div>
                <div class="mailingAddress">
                    <p class="vehicleIdentify">Mailing Address</p>
                    <div class="min-h-text">
                        <p class="vehicleIdentifier">${getValue(formsData?.lessees[0]?.mailingAddress).toUpperCase()}</p>
                    </div>
                </div>
            </div>
            ${lessee2Info}
        </div>`;
    } else {
        return "";
    }
}

function renderCheckDetails(checkDeposit) {
    if (checkDeposit.length === 0) {
        return "";
    }

    // deposits based on type
    const depositToUs = checkDeposit.filter(item => item.type === 1);
    const depositToCounty = checkDeposit.filter(item => item.type === 2);

    //details for each deposit
    const renderDeposits = (deposits) =>
        deposits.map(deposit => `
            <div style="display: flex; flex-wrap: wrap;">
                <div style="width: 49%;">
                    <p style="color: #5e6470;">${deposit?.chequeNumber || ""}</p>
                </div>
                <div style="width: 49%;">
                    <p style="color: #5e6470;">${deposit?.amount || ""}</p>
                </div>
            </div>
        `).join("");

    return `
        <div style="width: 50%; border-left: 0.5px solid #d7dae0; padding: 8px 16px; min-height: 110px;">
            <h2>Check Details</h2>
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between;">
                <div style="width: 49%;">
                    <p style="color: #5e6470;"><b>Deposit To Us</b></p>
                    ${renderDeposits(depositToUs)}
                </div>
                <div style="width: 49%;">
                    <p style="color: #5e6470;"><b>Deposit To County</b></p>
                    ${renderDeposits(depositToCounty)}
                </div>
            </div>
            <p class="vehicleIdentifier" style="color: #5e6470;">
                <span></span>
            </p>
        </div>
    `;
}
function formatNegative(value) {
    if (value === null || value === "" || value === undefined) {
        return "";
    }
    const numericValue = parseFloat(value.toString().replace(/,/g, ''));

    return numericValue < 0 ? `(${Math.abs(numericValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
        : numericValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export {
    generateLesseeInfo, generateOdometerCode, generateNoOfOwners, formatCustomerIdMv1s, formatClientAndUnit, formatInvoiceAndCustomer,
    formatStamps, assignDollarValue, renderLien, renderLienDetails, formatStringToHTML, generateDynamicHTMLRow, sumOfValues, subtractValues,
    calculateTotalTaxableValue, sumAdditionalFees, generateLesseeRender, formatNegative, renderCheckDetails
}