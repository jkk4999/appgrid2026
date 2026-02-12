export type StatusBarVariant = 'default' | 'subgrid';

export function getDefaultStatusBarPanels(
  variant: StatusBarVariant = 'default'
): { statusPanel: string }[] {
  switch (variant) {
    case 'subgrid':
      // Keep same defaults for now; variant hook for future tweaks
      return [
        { statusPanel: 'agTotalAndFilteredRowCountComponent' },
        { statusPanel: 'agTotalRowCountComponent' },
        { statusPanel: 'agFilteredRowCountComponent' },
        { statusPanel: 'agSelectedRowCountComponent' },
        { statusPanel: 'agAggregationComponent' },
      ];
    case 'default':
    default:
      return [
        { statusPanel: 'agTotalAndFilteredRowCountComponent' },
        { statusPanel: 'agTotalRowCountComponent' },
        { statusPanel: 'agFilteredRowCountComponent' },
        { statusPanel: 'agSelectedRowCountComponent' },
        { statusPanel: 'agAggregationComponent' },
      ];
  }
}

