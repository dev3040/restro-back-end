export enum DataEntryFormType {
   //Activity log
   BASIC_INFO_ACTIVITY = "Basic Info",
   VEHICLE_INFO_ACTIVITY = "Vehicle Info",
   TITLE_INFO_ACTIVITY = "Title Info",
   TRADE_IN_INFO_ACTIVITY = "Trade In Info",
   LESSOR_INFO_ACTIVITY = "Lessor Info",
   LESSEE_INFO_ACTIVITY = "Lessee Info",
   SELLER_INFO_ACTIVITY = "Seller Info",
   INSURANCE_INFO_ACTIVITY = "Insurance Info",
   BUYER_INFO_ACTIVITY = "Buyer Info",
   REGISTRATION_INFO_ACTIVITY = "Registration Info",
   BILLING_INFO_ACTIVITY = "Billing Info",
   LIEN_INFO_ACTIVITY = "Lien Info",
   TAVT_FORM_ACTIVITY = "Taxes & Fees",
   SIGNED_DOCUMENT_ACTIVITY = "Signed Documents",
   BILLING_PROCESS_ACTIVITY = "Billing Process",
   


   //Activity log : Summary => Form details update
   SUMMARY_TICKET_ACTIVITY = "Task - Summary",
   SUMMARY_BASIC_INFO_ACTIVITY = "Basic Info - Summary",
   SUMMARY_VEHICLE_INFO_ACTIVITY = "Vehicle Info - Summary",
   SUMMARY_TITLE_INFO_ACTIVITY = "Title Info - Summary",
   SUMMARY_TAVT_FORM__ACTIVITY = "Taxes & Fees - Summary",
   SUMMARY_SELLER_INFO_ACTIVITY = "Seller Info - Summary",
   SUMMARY_BUYER_INFO_ACTIVITY = "Buyer Info - Summary",
   SUMMARY_TRADE_IN_ACTIVITY = "Trade In Info - Summary",
   SUMMARY_LIEN_INFO_ACTIVITY = "Lien Info - Summary",
   SUMMARY_BILLING_INFO_ACTIVITY = "Billing Info - Summary",

   //Form API 
   BASIC_INFO = "basicInfo",
   VEHICLE_INFO = "vehicleInfo",
   TITLE_INFO = "titleInfo",
   TRADE_IN_INFO = "tradeInInfo",
   LESSOR_INFO = "lessorInfo",
   LESSEE_INFO = "lesseeInfo",
   SELLER_INFO = "sellerInfo",
   INSURANCE_INFO = "insuranceInfo",
   BUYER_INFO = "buyerInfo",
   TICKET_INFO = "ticket",
   REGISTRATION_INFO = "registrationInfo",
   BILLING_INFO = "billingInfo",
   TAVT_FORM = "tavtForm",
   LIEN_INFO = "lienInfo",
   BILLING_PROCESS = "billingProcess",
   VIN_PROFILE = "vinProfile"
}

export enum FormType {
   BASIC_INFO_FORM = "basicInfo",
   VEHICLE_INFO_FORM = "vehicleInfo",
   TITLE_INFO_FORM = "titleInfo",
   TRADE_IN_INFO_FORM = "tradeInInfo",
   LIEN_INFO_FORM = "lienInfo",
   SELLER_INFO_FORM = "sellerInfo",
   INSURANCE_INFO_FORM = "insuranceInfo",
   BUYER_INFO_FORM = "buyerInfo",
   TICKET_INFO_FORM = "ticket",
   REGISTRATION_INFO_FORM = "registrationInfo",
   BILLING_INFO_FORM = "billingInfo",
   TAVT_FORM = "tavtForm",
   SIGNED_DOCUMENT = "signedDocument",
   BILLING_PROCESS = "billingProcess",
}