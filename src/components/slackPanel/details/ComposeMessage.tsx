import React from 'react';
import ShareToSlackPanel from '../../shareToSlack/ShareToSlackPanel';

interface ComposeMessageProps {
  apiClient: any;
  allChannels: any[];
  selectedRows?: any[];
  objectName?: string;
  onClose: () => void;
}

/**
 * Compose message detail view for center panel
 * Wraps ShareToSlackPanel for now
 */
const ComposeMessage: React.FC<ComposeMessageProps> = ({
  apiClient,
  allChannels,
  selectedRows = [],
  objectName = 'Record',
  onClose,
}) => {
  return (
    <ShareToSlackPanel
      onClose={onClose}
      apiClient={apiClient}
      selectedRows={selectedRows}
      objectName={objectName}
      allChannels={allChannels}
    />
  );
};

export default ComposeMessage;
