import React from 'react';

const ColumnsProxyToolPanel: React.FC<any> = () => {
  // Do not auto-open; SubgridCore listens for toolPanel visible event and opens dialog.
  return <div style={{ padding: 8 }}>Columns are managed in the dialog.</div>;
};

export default ColumnsProxyToolPanel;
