/**
 * Adapter đo lường (SRS Mục 9 & NFR-MN-08)
 * Tuyệt đối KHÔNG ghi dữ liệu cá nhân (tên, số điện thoại, địa chỉ cụ thể).
 */

export interface AnalyticsEvent {
  eventName: string;
  timestamp: number;
  properties?: Record<string, any>;
}

const eventLog: AnalyticsEvent[] = [];

export function track(eventName: string, props: Record<string, any> = {}): void {
  // Loại bỏ các trường PII nếu vô tình truyền vào
  const safeProps = { ...props };
  delete safeProps.name;
  delete safeProps.customerName;
  delete safeProps.phone;
  delete safeProps.phoneNumber;
  delete safeProps.address;
  delete safeProps.street;
  delete safeProps.email;

  const event: AnalyticsEvent = {
    eventName,
    timestamp: Date.now(),
    properties: safeProps,
  };

  eventLog.push(event);

  if (process.env.NODE_ENV !== 'production') {
    // In ra console ở môi trường dev để kiểm tra luồng
    // console.log(`[Analytics] ${eventName}:`, safeProps);
  }

  // Bắn custom event lên window để DevPanel hoặc test runner theo dõi
  window.dispatchEvent(new CustomEvent('dss:analytics-track', { detail: event }));
}

export function getEventLog(): AnalyticsEvent[] {
  return [...eventLog];
}

export function clearEventLog(): void {
  eventLog.length = 0;
}
