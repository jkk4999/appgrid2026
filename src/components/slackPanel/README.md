# SlackPanel Architecture

This document describes the refactored architecture of the SlackPanel component.

## Overview

The SlackPanel has been refactored to follow a scalable, component-based architecture that separates concerns and makes it easy to add new features.

## Folder Structure

```
slackPanel/
├── components/              # Shared UI components
│   ├── AddMenu.tsx         # Popup menu for "Add" button
│   └── PersonaMenu.tsx     # Popup menu for persona/profile icon
├── views/                  # Left panel views (one per sidebar button)
│   ├── HomeView.tsx
│   ├── DirectMessagesView.tsx
│   ├── ActivityView.tsx
│   ├── DraftsView.tsx
│   └── ChannelsView.tsx
├── details/                # Center panel detail components
│   ├── EmptyState.tsx
│   ├── ComposeMessage.tsx
│   ├── MessageDetail.tsx
│   └── ChannelDetail.tsx
├── types.ts                # TypeScript type definitions
├── SlackPanel.tsx          # Main container component
└── README.md              # This file
```

## Architecture Pattern

### Three-Panel Layout

The SlackPanel uses a three-panel layout:

1. **Sidebar (Left)**: Navigation buttons (Home, DMs, Activity, etc.)
2. **Left Panel**: Content based on selected sidebar view
3. **Center Panel**: Detail view based on selected item from left panel

### State Management

#### View State
```typescript
const [selectedView, setSelectedView] = useState<SidebarView>('home');
```
Controls which view is displayed in the left panel.

#### Content State
```typescript
const [centerPanelContent, setCenterPanelContent] = useState<CenterPanelContent>({
  type: 'empty',
});
```
Controls which detail component is displayed in the center panel.

### Communication Pattern

**Callback Props** are used for panel-to-panel communication:

```typescript
// Handler in main SlackPanel component
const handleViewItemClick: ViewItemClickHandler = useCallback(
  (contentType, data) => {
    setCenterPanelContent({ type: contentType, data });
    if (data?.channelId) {
      setSelectedChannelId(data.channelId);
    }
  },
  []
);

// Passed to view components
<DirectMessagesView
  onItemClick={handleViewItemClick}
  selectedChannelId={selectedChannelId}
/>
```

### Router Pattern

Two routers control panel content:

#### Left Panel Router
```typescript
const renderLeftPanel = () => {
  switch (selectedView) {
    case 'home':
      return <HomeView onItemClick={handleViewItemClick} />;
    case 'dms':
      return <DirectMessagesView ... />;
    // etc.
  }
};
```

#### Center Panel Router
```typescript
const renderCenterPanel = () => {
  switch (centerPanelContent.type) {
    case 'message':
      return <MessageDetail ... />;
    case 'compose':
      return <ComposeMessage ... />;
    case 'empty':
    default:
      return <EmptyState />;
  }
};
```

## Component Responsibilities

### SlackPanel (Main Container)
- Manages global state (channels, config, selected view)
- Initializes Slack integration
- Routes to appropriate view/detail components
- Handles menu actions (Add, Persona)

### View Components (Left Panel)
Each view component:
- Displays a list or content specific to that view
- Accepts `onItemClick` callback prop
- Calls `onItemClick(contentType, data)` when item is selected
- Highlights selected item

Example:
```typescript
const DirectMessagesView: React.FC<DirectMessagesViewProps> = ({
  channels,
  selectedChannelId,
  onItemClick,
}) => {
  const handleDmClick = (dm: SlackChannel) => {
    onItemClick('message', { channelId: dm.id, channel: dm });
  };
  // render list...
};
```

### Detail Components (Center Panel)
Each detail component:
- Receives data via props
- Displays detailed view of selected item
- Can include complex interactions (message threads, etc.)

Example:
```typescript
const MessageDetail: React.FC<MessageDetailProps> = ({
  channelId,
  channel
}) => {
  // Render message thread view
};
```

### Menu Components
- **AddMenu**: Displays "Create" options (Message, Channel, Huddle, etc.)
- **PersonaMenu**: Displays user profile options (Status, Preferences, etc.)

Both use MUI's `Menu` component and accept callback props for actions.

## Adding New Features

### Adding a New View

1. Create view component in `views/`:
```typescript
// views/MyNewView.tsx
import { BaseViewProps } from '../types';

const MyNewView: React.FC<BaseViewProps> = ({ onItemClick }) => {
  return <Box>My Content</Box>;
};
```

2. Add to sidebar view type:
```typescript
// types.ts
export type SidebarView = 'home' | 'dms' | 'activity' | 'drafts' | 'channels' | 'mynew';
```

3. Add sidebar button and router case in `SlackPanel.tsx`

### Adding a New Detail Component

1. Create detail component in `details/`:
```typescript
// details/MyDetail.tsx
const MyDetail: React.FC<MyDetailProps> = ({ data }) => {
  return <Box>Detail View</Box>;
};
```

2. Add to center panel content type:
```typescript
// types.ts
export type CenterPanelContentType = 'message' | 'channel' | 'mynew';
```

3. Add router case in `renderCenterPanel()`

## Benefits

✅ **Scalability**: Easy to add new views and details
✅ **Maintainability**: Clear component boundaries
✅ **Testability**: Each component can be unit tested
✅ **Type Safety**: TypeScript ensures correct data flow
✅ **Reusability**: Components can be reused
✅ **Performance**: Easy to add React.memo optimization

## Migration Notes

The old `SlackPanel.tsx` has been backed up to `SlackPanel.tsx.backup`.

Key changes from old to new:
- Inline view rendering → Dedicated view components
- Hardcoded panel switching → Router pattern
- Direct state manipulation → Callback props
- Single component file → Multi-file architecture
