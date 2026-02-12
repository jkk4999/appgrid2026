# Slack Integration - New Architecture

## Overview

This directory contains the simplified, hook-based Slack integration architecture that replaces the complex caching-based approach.

## Customer Configuration Guide (Admin-Facing)

This integration requires a Slack app that your customer controls (or your own public Slack app). The Slack app provides the OAuth `Client ID` and `Client Secret` that must be saved in the custom metadata record.

### Key Concepts

- **Slack app ownership**: The `Client ID` and `Client Secret` are visible only to the Slack app owner.
- **Slack for Salesforce**: Installing "Slack for Salesforce" does not expose its credentials to customers. Those credentials cannot be reused for this integration.
- **Workspace vs. app**: A Slack workspace can have multiple apps installed (e.g., Slack for Salesforce and this app) connected to the same Salesforce org.

### Required Data

- Slack app `Client ID`
- Slack app `Client Secret`
- Slack workspace to authorize (existing or new)

### Recommended Setup Flow

1. **Create or choose a Slack app**:
   - If the customer already owns a Slack app, they can use it.
   - Otherwise, create a new Slack app at `https://api.slack.com/apps`.
2. **Collect credentials**:
   - In the Slack app page, go to `Basic Information` → `App Credentials`.
   - Copy the `Client ID` and `Client Secret`.
3. **Configure Salesforce**:
   - Add those values to the custom metadata record for this integration.
4. **Authorize the app**:
   - Complete the OAuth flow from the app UI to connect the Slack workspace.

### Common Questions

- **Can we reuse Slack for Salesforce credentials?**
  - No. Those credentials are owned by Salesforce and are not available to customers.
- **Can we connect the same workspace to multiple apps?**
  - Yes. A workspace can have multiple Slack apps installed and authorized, including this integration.
- **Do we need a new workspace?**
  - No. Use any existing workspace the admin wants to connect.

## Key Principles

1. **No Caching** - Direct API calls, React manages state
2. **Separation of Concerns** - API layer separate from hooks separate from views
3. **Explicit Data Flow** - Clear, traceable path from API → Hook → View
4. **Simple Refresh** - Just call `refresh()` - no cache invalidation needed

## Directory Structure

```
slack/
├── api/                    # Raw API calls (thin wrappers)
│   ├── authApi.ts         # Authentication & OAuth
│   ├── userApi.ts         # User operations
│   ├── channelApi.ts      # Channel operations & Salesforce links
│   └── messageApi.ts      # Message operations
└── hooks/                  # React hooks for data fetching
    ├── useSlackAuth.ts    # Authentication state
    ├── useSlackUsers.ts   # User list
    ├── useChannelLinks.ts # Salesforce channel links
    └── useChannelMessages.ts # Channel message history
```

## API Layer

### Design Philosophy

- **Thin wrappers** over `apiClient` - no business logic
- **Promise-based** - async/await everywhere
- **Typed** - TypeScript interfaces for all data
- **Error handling** - Throw errors, let hooks handle them
- **Logging** - prettyPrint for debugging

### Example API Function

```typescript
// slack/api/channelApi.ts
export async function getChannelInfo(
  apiClient: APIClient,
  channelId: string
): Promise<SlackChannel> {
  prettyPrint(`[channelApi] Getting channel info: ${channelId}`, null, 'blue');

  const response = await apiClient.slackGetConversationInfo({
    channel: channelId
  });
  const data = typeof response === 'string' ? JSON.parse(response) : response;

  if (!data.ok) {
    throw new Error(data.error || 'Failed to get channel info');
  }

  return data.channel;
}
```

## Hooks Layer

### Design Philosophy

- **Manage state** - loading, error, data
- **Auto-fetch** - useEffect triggers on deps change
- **Expose refresh** - Manual refresh via callback
- **Composable** - Hooks can use other hooks

### Example Hook

```typescript
// slack/hooks/useChannelLinks.ts
export function useChannelLinks(
  apiClient: APIClient,
  recordId: string | null,
  currentUserId: string | null
) {
  const [channelLinks, setChannelLinks] = useState<ChannelLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    // Fetch logic here
  }, [apiClient, recordId, currentUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { channelLinks, loading, error, refresh };
}
```

## View Layer

### SlackPanel2.tsx

Main component using the new architecture:

- Uses `useSlackAuth()` for authentication
- Uses `useChannelLinks()` to get refresh callback
- Passes `onSuccess` callback to ShareToSlackPanel2
- Clean, simple state management

### HomeView2.tsx

Simplified left sidebar:

- Uses `useChannelLinks()` hook
- ~80% less code than original
- No complex initialization logic
- Easy to understand data flow

### ShareToSlackPanel2.tsx

Message composition using new API:

- Uses API functions directly (`postMessage`, `createChannelLink`)
- Calls `onSuccess()` callback to trigger parent refresh
- No cache invalidation needed

## Data Flow

### Opening SlackPanel

```
User clicks Slack icon
  → SlackPanel2 renders
  → useSlackAuth() checks authentication
  → useChannelLinks() fetches channel links
  → HomeView2 renders links
```

### Sending a Message

```
User composes message in ShareToSlackPanel2
  → Clicks Send
  → postMessage() API call
  → createChannelLink() API call
  → onSuccess() callback fires
  → refreshChannelLinks() called
  → useChannelLinks() re-fetches
  → HomeView2 re-renders with new DM
```

### Switching Records

```
User selects different grid row
  → selectedSlackRow changes in zustand
  → SlackPanel2 detects change (via useEffect in old code)
  → slackPanelRecordId updates
  → useChannelLinks() deps change
  → Hook re-fetches for new record
  → HomeView2 re-renders
```

## Benefits Over Old Architecture

### Authentication issues

- Check: useSlackAuth() logs
- Check: Does apiClient.slackGetUserToken() work?
- Try: Disconnect and reconnect

### Performance issues

- If too many API calls, consider adding `enabled` flag to hooks
- If slow, check network tab for Slack API response times
- React DevTools Profiler can show re-render issues

## Future Enhancements

Once stable, consider:

- React Query for advanced caching (if needed)
- Optimistic updates for better UX
- WebSocket for real-time messages
- Message threading support
- File upload support
