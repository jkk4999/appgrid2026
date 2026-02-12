import React from 'react';
import { CustomCellRendererProps } from 'ag-grid-react';

export const CustomGroupCellRenderer: React.FC<CustomCellRendererProps> = (props) => {

   // Determine if the row is a group
   const isGroup = props.node.group;

   return (
      <div
         style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            // color: theme.palette.text.primary,  // override inherited color
            // color: theme.palette.text.primary,              // text color from theme
            // backgroundColor: isGroup
            //    ? theme.palette.action.hover                 // optional highlight for group rows
            //    : 'transparent',
            fontWeight: isGroup ? 600 : 400,               // bold for group headers
         }}
      >
         {props.value}
      </div>
   );
};

