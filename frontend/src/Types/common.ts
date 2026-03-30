export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export interface ReportDataPoint {
  label: string;
  name?: string;
  value: number;
  [key: string]: unknown;
}
