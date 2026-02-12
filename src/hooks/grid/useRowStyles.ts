import { useCallback } from 'react';

import {
  buildRowStyleCss,
  findFirstMatchingRowStyle
} from '../../gridMethods/styleUtils';

export function useRowStyles(rowStyles: any[] | undefined) {
  const getRowStyle = useCallback(
    (params: { data?: any; node?: any }) => {
      if (!rowStyles?.length) return {} as any;
      const matchedStyle = findFirstMatchingRowStyle(
        rowStyles,
        params?.data,
        params?.node
      );
      if (!matchedStyle) return {} as any;
      return buildRowStyleCss(matchedStyle);
    },
    [rowStyles]
  );

  return getRowStyle;
}
