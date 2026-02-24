export type ImageToExcelType = 'receipt' | 'namecard';

export interface ReceiptData {
  date: string;
  storeName: string;
  items: string;
  totalAmount: string;
  paymentMethod: string;
  originalFilename: string;
}

export interface NamecardData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  originalFilename: string;
}

export type Confidence = 'high' | 'medium' | 'low';

export interface ExtractionResult<T = ReceiptData | NamecardData> {
  data: T;
  confidence: Confidence;
}
