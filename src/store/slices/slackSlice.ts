import { StateCreator } from 'zustand';
import type { SlackSlice, Store } from '../types';

export const createSlackSlice: StateCreator<
  Store,
  [['zustand/devtools', never]],
  [],
  SlackSlice
> = (set) => ({
  // State
  showSlackPanel: false,
  showSlackConfigPanel: false,
  showShareToSlackDialog: false,
  slackConfigConfigured: null,
  slackPanelRecordId: null,
  slackPanelObjectType: null,
  slackPanelRecordName: null,
  slackUserToken: null,
  slackChannelsRefreshTrigger: 0,
  slackDirectMessages: [],
  slackDirectMessagesRefreshTrigger: 0,
  selectedSlackRow: null,

  // Setters
  setShowSlackPanel: (val) => set({ showSlackPanel: val }),
  setShowSlackConfigPanel: (val) => set({ showSlackConfigPanel: val }),
  setShowShareToSlackDialog: (val) => set({ showShareToSlackDialog: val }),
  setSlackConfigConfigured: (configured) => set({ slackConfigConfigured: configured }),
  setSlackPanelRecord: (recordId, objectType, recordName) => set({
    slackPanelRecordId: recordId,
    slackPanelObjectType: objectType,
    slackPanelRecordName: recordName,
  }),
  setSlackUserToken: (token) => set({ slackUserToken: token }),
  triggerSlackChannelsRefresh: () => set((state) => ({
    slackChannelsRefreshTrigger: state.slackChannelsRefreshTrigger + 1
  })),
  setSlackDirectMessages: (messages) => set({ slackDirectMessages: messages }),
  triggerSlackDirectMessagesRefresh: () => set((state) => ({
    slackDirectMessagesRefreshTrigger: state.slackDirectMessagesRefreshTrigger + 1
  })),
  setSelectedSlackRow: (row) => set({ selectedSlackRow: row }),
});
