export interface ViewTypeOption {
  label: string;
  name: string;
}

export interface ViewTypeOptionsState {
  options: ViewTypeOption[];
  showGridViewType: ViewTypeOption;
}

export interface RootState {
  viewTypeOptions: ViewTypeOptionsState;
  // Add other slices of state here
}
