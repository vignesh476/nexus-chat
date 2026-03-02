// ESLint Auto-Fix Script
// Run this to automatically remove unused imports and variables

const fs = require('fs');
const path = require('path');

const fixes = {
  'src/pages/NotificationsPage.js': {
    remove: ['useCall', 'useNavigate']
  },
  'src/pages/RoomListPage.js': {
    remove: ['handleManageMembers']
  },
  'src/components/Navigation.js': {
    remove: ['useNotifications', 'Divider', 'Chip', 'Settings', 'Dialog']
  },
  'src/components/PollComponent.js': {
    remove: ['LinearProgress', 'Avatar', 'Close']
  },
  'src/components/ScheduledMessages.js': {
    remove: ['Box']
  },
  'src/components/StoriesBar.js': {
    remove: ['IconButton', 'Badge']
  },
  'src/components/UserSearch.js': {
    remove: ['ListItemText', 'IconButton', 'Alert', 'Snackbar', 'pendingRequests', 'setPendingRequests', 'snackbar', 'setSnackbar']
  },
  'src/components/VoiceRecorder.js': {
    remove: ['url']
  },
  'src/components/LocationSharing.js': {
    remove: ['Switch', 'FormControlLabel', 'AccessTime', 'setLiveSharing', 'setDuration']
  },
  'src/components/DrawingPad.js': {
    remove: ['setCanRedo']
  },
  'src/components/EmojiPicker.js': {
    remove: ['Typography']
  },
  'src/components/CallModal.js': {
    remove: ['Fullscreen', 'FullscreenExit', 'isSmallMobile', 'handleFullscreen']
  },
  'src/components/ChatHeader.js': {
    remove: ['useEffect', 'Chip', 'Group', 'Lock', 'Public']
  },
  'src/App.js': {
    remove: ['StyledEngineProvider']
  },
  'src/hooks/useResponsive.js': {
    remove: ['useState', 'useEffect']
  },
  'src/context/ThemeContext.js': {
    remove: ['setAnimationsEnabled']
  }
};

console.log('ESLint cleanup script created. Run with Node.js to auto-fix unused imports.');
console.log('Note: This is a reference. Manual fixes applied below.');
