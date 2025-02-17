import { OrderStatusType } from '../coupang-api.service';
import { Optional } from '@nestjs/common';

export interface Orderer {
  name: String;
  email?: String | null;
  safeNumber:	String;
  ordererNumber?: String | null;
}

export interface Receiver {
  name: String;
  safeNumber:	String;
  receiverNumber?: String | null;
  addr1: String;
  addr2: String;
  postCode:	String;
}

export interface OrderItem {
  vendorItemPackageId: number;
  vendorItemPackageName?: string;
  productId?: number;
  vendorItemId: number;
  vendorItemName: string;
  shippingCount: number;
  salesPrice: number;
  orderPrice: number;
  discountPrice: number;
  instantCouponDiscount: number;
  downloadableCouponDiscount: number;
  coupangDiscount: number;
  externalVendorSkuCode?: string;
  etcInfoHeader?: string;
  etcInfoValue?: string;
  etcInfoValues?: string[];
  sellerProductId: number;
  sellerProductName: string;
  sellerProductItemName: string;
  firstSellerProductItemName: string;
  cancelCount: number;
  holdCountForCancel: number;
  estimatedShippingDate?: string; // yyyy-mm-dd
  plannedShippingDate?: string; // yyyy-mm-dd
  invoiceNumberUploadDate?: string; // yyyy-MM-dd'T'HH:mm:ss
  extraProperties?: Record<string, string>; // key:value 형태
  pricingBadge: boolean;
  usedProduct: boolean;
  confirmDate?: string; // yyyy-MM-dd HH:mm:ss
  deliveryChargeTypeName: string; // 유료, 무료
  upBundleVendorItemId?: number;
  upBundleVendorItemName?: string;
  upBundleSize?: number;
  upBundleItem: boolean;
  canceled: boolean;
}

export interface OverseaShippingInfoDto {
  personalCustomsClearanceCode?: string;
  orderersSsn?: string | null;
  ordererPhoneNumber?: string;
}

export type ShipmentType = 'THIRD_PARTY' | 'CGF' | 'CGF LITE'

export class CoupangOrderDto {
  shipmentBoxId: number;
  orderId: number;
  orderedAt: String;
  orderer: Orderer[];
  paidAt: String;
  status: OrderStatusType;
  shippingPrice: number;
  remotePrice: number;
  remoteArea: boolean;
  parcelPrintMessage?: String | null;
  splitShipping: boolean;
  ableSplitShipping: boolean;
  receiver: Receiver;
  orderItems: OrderItem[];
  overseaShippingInfoDto: OverseaShippingInfoDto[];
  deliveryCompanyName: String;
  invoiceNumber: String;
  inTrasitDateTime?: String | null;
  deliveredDate?: String | null;
  refer: String;
  shipmentType: ShipmentType;
}