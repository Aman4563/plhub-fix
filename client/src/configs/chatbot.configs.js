/**
 * Chatbot Configuration
 * Centralized configuration for the AI chatbot component
 */

const chatbotConfigs = {
  // Message handling
  messages: {
    maxHistoryMessages: 20, // Max messages to send for context
    maxInputLength: 1000, // Max characters for user input
    maxRetries: 3, // Max retries for failed messages
  },

  // UI timing
  timing: {
    typingDebounceMs: 300, // Debounce for typing indicator
    autoScrollDelayMs: 100, // Delay before auto-scroll
    focusDelayMs: 300, // Delay before focusing input
    rateLimitMs: 1000, // Minimum time between messages
    animationDurationMs: 300, // Animation duration
  },

  // UI dimensions
  dimensions: {
    chatWidth: { xs: "100%", sm: 400 },
    chatHeight: { xs: "100vh", sm: 600 },
    maxChatHeight: { xs: "100vh", sm: "85vh" },
    avatarSize: 32,
    fabSize: 60,
    mediaCardPosterWidth: 50,
    mediaCardPosterHeight: 75,
  },

  // Virtualization
  virtualization: {
    enabled: true,
    estimatedMessageHeight: 120,
    overscanCount: 3,
  },

  // Cache settings (for TanStack Query)
  cache: {
    staleTimeMs: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  },

  // Quick prompts - keys for i18n
  quickPromptKeys: [
    "chatbot.prompts.trending",
    "chatbot.prompts.thriller",
    "chatbot.prompts.comedy",
    "chatbot.prompts.watchlist",
    "chatbot.prompts.scifi",
  ],

  // Default quick prompts (fallback)
  defaultQuickPrompts: [
    "What's trending this week? 🔥",
    "Suggest a thriller like Inception",
    "Best feel-good comedies",
    "Show my watchlist",
    "Top rated sci-fi movies",
  ],

  // Welcome message key for i18n
  welcomeMessageKey: "chatbot.welcome",

  // Default welcome message (fallback)
  defaultWelcomeMessage: `Hey there! 👋 I'm your **AI movie & TV assistant** with superpowers!

### What I can do:
• 🔍 **Search** movies and TV shows
• 📊 **Get trending** content
• ➕ **Add to watchlist** or favorites
• ✍️ **Write reviews** (with your approval)
• 🎯 Find **similar content**

Just ask naturally - like "Add Inception to my watchlist" or "Write a review for Breaking Bad"!`,

  // Accessibility
  accessibility: {
    chatWindowLabel: "AI Movie Assistant Chat Window",
    messageListLabel: "Chat messages",
    inputLabel: "Type your message",
    sendButtonLabel: "Send message",
    closeButtonLabel: "Close chat",
    minimizeButtonLabel: "Minimize chat",
    newChatButtonLabel: "Start new chat",
    historyButtonLabel: "View chat history",
    retryButtonLabel: "Retry sending message",
  },

  // Storage keys
  storage: {
    sessionIdKey: "chatbot_session_id",
    historyIdKey: "current_chat_history_id",
  },
};

export default chatbotConfigs;

