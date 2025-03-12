interface Orderer {
  name: string;
  email: string;
  safeNumber: string;
  ordererNumber: string | null;
}

interface Receiver {
  name: string;
  safeNumber: string;
  receiverNumber: string | null;
  addr1: string;
  addr2: string;
  postCode: string;
}

interface OrderItem {
  vendorItemPackageId: number;
  vendorItemPackageName: string;
  productId: number;
  vendorItemId: number;
  vendorItemName: string;
  shippingCount: number;
  salesPrice: number;
  orderPrice: number;
  discountPrice: number;
  instantCouponDiscount: number;
  downloadableCouponDiscount: number;
  coupangDiscount: number;
  externalVendorSkuCode: string;
  etcInfoHeader: string | null;
  etcInfoValue: string | null;
  etcInfoValues: string | null;
  sellerProductId: number;
  sellerProductName: string;
  sellerProductItemName: string;
  firstSellerProductItemName: string;
  cancelCount: number;
  holdCountForCancel: number;
  estimatedShippingDate: string;
  plannedShippingDate: string;
  invoiceNumberUploadDate: string;
  extraProperties: Record<string, any>;
  pricingBadge: boolean;
  usedProduct: boolean;
  confirmDate: string | null;
  deliveryChargeTypeName: string;
  upBundleVendorItemId: number;
  upBundleVendorItemName: string;
  upBundleSize: number;
  upBundleItem: boolean;
  canceled: boolean;
}

interface OverseaShippingInfo {
  personalCustomsClearanceCode: string;
  ordererSsn: string;
  ordererPhoneNumber: string;
}

class OrderSheetResponseDto {
  shipmentBoxId: number;
  orderId: number;
  orderedAt: string;
  orderer: Orderer;
  paidAt: string;
  status: string;
  shippingPrice: number;
  remotePrice: number;
  remoteArea: boolean;
  parcelPrintMessage: string;
  splitShipping: boolean;
  ableSplitShipping: boolean;
  receiver: Receiver;
  orderItems: OrderItem[];
  overseaShippingInfoDto: OverseaShippingInfo;
  deliveryCompanyName: string;
  invoiceNumber: string;
  inTrasitDateTime: string;
  deliveredDate: string;
  refer: string;
  shipmentType: string;
}