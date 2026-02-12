// used in CustomColumnManager
export interface ColumnItem {
  id: string;
  name: string;
  child?: ColumnItem[];
  isSelected?: boolean;
  visible?: boolean;
  [key: string]: any;
}
