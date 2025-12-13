/**
 * AIChatBot - AI-powered movie/TV recommendation floating chat widget
 * 
 * Features:
 * - TanStack Query for state management (single source of truth)
 * - STREAMING responses with real-time text display
 * - Optimistic updates for instant feedback
 * - Message retry mechanism for failed messages
 * - Message editing and deletion
 * - Rate limiting to prevent spam
 * - Full accessibility (ARIA labels, keyboard navigation)
 * - Internationalization support (i18n)
 * - Error boundary integration
 * - Virtualized message list for performance
 * - Proper cleanup and memory management
 */

import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import {
  Box,
  Fab,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Zoom,
  Slide,
  Chip,
  CircularProgress,
  useTheme,
  alpha,
  Tooltip,
  Badge,
  Button,
  Menu,
  MenuItem,
  ListItemText,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  SmartToy as BotIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Movie as MovieIcon,
  Tv as TvIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  KeyboardArrowDown as MinimizeIcon,
  History as HistoryIcon,
  Replay as RetryIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Stop as StopIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import watchlistApi from "../../api/modules/watchlist.api";
import tmdbConfigs from "../../api/configs/tmdb.configs";
import chatbotConfigs from "../../configs/chatbot.configs";
import { addToWatchlist } from "../../redux/features/watchlistSlice";
import { setAuthModalOpen } from "../../redux/features/authModalSlice";
import { 
  useChatSessions, 
  useChatMessages,
  useClearChatSession,
  usePrefetchChatSession,
  useClearLocalMessages,
  CHAT_KEYS,
} from "../../hooks/useChatHistory";
import ChatbotErrorBoundary from "./ChatbotErrorBoundary";
import { useQueryClient } from "@tanstack/react-query";

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook for managing localStorage with SSR safety
 */
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? item : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue(value);
      if (typeof window !== "undefined") {
        if (value === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, value);
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
};

/**
 * Debounce hook for rate limiting
 */
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  
  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Markdown Renderer Component
 * Uses react-markdown with MUI-styled components
 */
const MarkdownRenderer = memo(({ content }) => {
  const theme = useTheme();

  const components = useMemo(() => ({
    h1: ({ children }) => (
      <Typography variant="h6" sx={{ fontWeight: 700, mt: 2, mb: 1, color: theme.palette.primary.main }}>
        {children}
      </Typography>
    ),
    h2: ({ children }) => (
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1.5, mb: 0.5, color: theme.palette.primary.main }}>
        {children}
      </Typography>
    ),
    h3: ({ children }) => (
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1, mb: 0.5, color: theme.palette.primary.main }}>
        {children}
      </Typography>
    ),
    p: ({ children }) => (
      <Typography variant="body2" component="p" sx={{ mb: 0.5, lineHeight: 1.6 }}>
        {children}
      </Typography>
    ),
    strong: ({ children }) => (
      <Typography component="strong" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
        {children}
      </Typography>
    ),
    em: ({ children }) => (
      <Typography component="em" sx={{ fontStyle: "italic" }}>
        {children}
      </Typography>
    ),
    code: ({ inline, children }) => (
      inline ? (
        <Box
          component="code"
          sx={{
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            padding: "2px 6px",
            borderRadius: 1,
            fontSize: "0.85em",
            fontFamily: "monospace",
          }}
        >
          {children}
        </Box>
      ) : (
        <Box
          component="pre"
          sx={{
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            p: 1.5,
            borderRadius: 1,
            overflow: "auto",
            fontSize: "0.85em",
            fontFamily: "monospace",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <code>{children}</code>
        </Box>
      )
    ),
    ul: ({ children }) => (
      <Box component="ul" sx={{ pl: 0, my: 0.5, listStyle: "none" }}>
        {children}
      </Box>
    ),
    ol: ({ children }) => (
      <Box 
        component="ol" 
        sx={{ pl: 0, my: 0.5, listStyle: "none" }}
        data-ordered="true"
      >
        {children}
      </Box>
    ),
    li: ({ children, node }) => {
      const isOrdered = node?.parentNode?.tagName === "ol";
      return (
        <Box
          component="li"
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            my: 0.3,
            counterIncrement: isOrdered ? "item" : undefined,
            "&::before": isOrdered ? {
              content: 'counter(item) "."',
              color: theme.palette.primary.main,
              fontWeight: 600,
              minWidth: 20,
            } : undefined,
          }}
        >
          {!isOrdered && (
            <Typography component="span" sx={{ color: theme.palette.primary.main }}>•</Typography>
          )}
          <Typography variant="body2" component="span" sx={{ flex: 1 }}>
            {children}
          </Typography>
        </Box>
      );
    },
    blockquote: ({ children }) => (
      <Box
        sx={{
          borderLeft: `3px solid ${theme.palette.primary.main}`,
          pl: 1.5,
          my: 1,
          color: theme.palette.text.secondary,
          fontStyle: "italic",
        }}
      >
        {children}
      </Box>
    ),
    a: ({ href, children }) => (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ color: theme.palette.primary.main }}
      >
        {children}
      </Link>
    ),
    hr: () => (
      <Box
        component="hr"
        sx={{
          border: "none",
          borderTop: `1px solid ${theme.palette.divider}`,
          my: 1.5,
        }}
      />
    ),
    table: ({ children }) => (
      <Box
        component="table"
        sx={{
          borderCollapse: "collapse",
          width: "100%",
          my: 1,
          fontSize: "0.85rem",
        }}
      >
        {children}
      </Box>
    ),
    th: ({ children }) => (
      <Box
        component="th"
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          p: 0.5,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          fontWeight: 600,
        }}
      >
        {children}
      </Box>
    ),
    td: ({ children }) => (
      <Box
        component="td"
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          p: 0.5,
        }}
      >
        {children}
      </Box>
    ),
  }), [theme]);

  if (!content) return null;

  return (
    <Box sx={{ "& > *:first-of-type": { mt: 0 }, "& > *:last-child": { mb: 0 }, counterReset: "item" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
});

MarkdownRenderer.displayName = "MarkdownRenderer";

/**
 * MediaCard - Compact card for recommended media
 */
const MediaCard = memo(({ media, onAddToWatchlist, onClick, isInWatchlist, t }) => {
  const theme = useTheme();

  return (
    <Paper
      component={motion.div}
      whileHover={{ scale: 1.02 }}
      elevation={0}
      sx={{
        display: "flex",
        gap: 1.5,
        p: 1,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        border: `1px solid ${theme.palette.divider}`,
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          borderColor: theme.palette.primary.main,
        },
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${media.title} - ${media.mediaType === "tv" ? "TV Show" : "Movie"}`}
    >
      <Box
        sx={{
          width: chatbotConfigs.dimensions.mediaCardPosterWidth,
          height: chatbotConfigs.dimensions.mediaCardPosterHeight,
          borderRadius: 1,
          overflow: "hidden",
          flexShrink: 0,
          bgcolor: theme.palette.action.hover,
        }}
      >
        {media.posterPath ? (
          <img
            src={tmdbConfigs.posterPath(media.posterPath)}
            alt={media.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {media.mediaType === "tv" ? <TvIcon color="disabled" /> : <MovieIcon color="disabled" />}
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {media.title}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
          <Chip
            label={media.mediaType === "tv" ? "TV" : "Movie"}
            size="small"
            sx={{
              height: 18,
              fontSize: "0.65rem",
              bgcolor: alpha(media.mediaType === "tv" ? theme.palette.info.main : theme.palette.warning.main, 0.2),
            }}
          />
          {media.voteAverage > 0 && (
            <Typography variant="caption" color="text.secondary">
              ⭐ {media.voteAverage?.toFixed(1)}
            </Typography>
          )}
        </Box>
        {media.overview && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3 }}
          >
            {media.overview}
          </Typography>
        )}
      </Box>

      <Tooltip title={isInWatchlist ? t("chatbot.alreadyInWatchlist") : t("chatbot.addToWatchlist")}>
        <span>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onAddToWatchlist(); }}
            disabled={isInWatchlist}
            aria-label={isInWatchlist ? t("chatbot.alreadyInWatchlist") : t("chatbot.addToWatchlist")}
            sx={{
              alignSelf: "center",
              bgcolor: isInWatchlist ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
            }}
          >
            <AddIcon fontSize="small" color={isInWatchlist ? "success" : "primary"} />
          </IconButton>
        </span>
      </Tooltip>
    </Paper>
  );
});

MediaCard.displayName = "MediaCard";

/**
 * Message Component - Individual chat message with edit/delete
 */
const MessageItem = memo(({ 
  message, 
  watchlistItems, 
  onAddToWatchlist, 
  onMediaClick, 
  onRetry,
  onEdit,
  onDelete,
  isStreaming,
  t,
  theme 
}) => {
  const isUser = message.role === "user";
  const isFailed = message.status === "failed";
  const isSending = message.status === "sending";
  const isMessageStreaming = message.status === "streaming";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);

  const handleEditStart = () => {
    setEditContent(message.content);
    setIsEditing(true);
  };

  const handleEditSave = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box 
        sx={{ 
          display: "flex", 
          justifyContent: isUser ? "flex-end" : "flex-start", 
          mb: 2, 
          gap: 1,
          opacity: isSending ? 0.7 : 1,
        }}
        role="listitem"
        aria-label={`${isUser ? "You" : "AI Assistant"}: ${message.content?.substring(0, 100) || ""}${(message.content?.length || 0) > 100 ? "..." : ""}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {!isUser && (
          <Avatar 
            sx={{ 
              width: chatbotConfigs.dimensions.avatarSize, 
              height: chatbotConfigs.dimensions.avatarSize, 
              bgcolor: isFailed ? theme.palette.error.main : theme.palette.primary.main, 
              flexShrink: 0 
            }}
          >
            {isFailed ? <ErrorIcon sx={{ fontSize: 18 }} /> : <BotIcon sx={{ fontSize: 18 }} />}
          </Avatar>
        )}

        <Box sx={{ maxWidth: "85%", position: "relative" }}>
          {/* Edit/Delete actions for user messages */}
          {isUser && showActions && !isEditing && !isSending && (
            <Box 
              sx={{ 
                position: "absolute", 
                top: -8, 
                right: 0, 
                display: "flex", 
                gap: 0.5,
                bgcolor: theme.palette.background.paper,
                borderRadius: 1,
                p: 0.25,
                boxShadow: 1,
                zIndex: 1,
              }}
            >
              <Tooltip title={t("chatbot.edit")}>
                <IconButton 
                  size="small" 
                  onClick={handleEditStart}
                  aria-label={t("chatbot.aria.editButton")}
                  sx={{ p: 0.5 }}
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("chatbot.delete")}>
                <IconButton 
                  size="small" 
                  onClick={() => onDelete(message.id)}
                  aria-label={t("chatbot.aria.deleteButton")}
                  sx={{ p: 0.5 }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: isUser 
                ? (isFailed ? theme.palette.error.main : theme.palette.primary.main)
                : alpha(theme.palette.background.paper, 0.8),
              color: isUser ? "#fff" : theme.palette.text.primary,
              border: isUser ? "none" : `1px solid ${isFailed ? theme.palette.error.main : theme.palette.divider}`,
              backdropFilter: "blur(10px)",
            }}
          >
            {isEditing ? (
              <Box>
                <TextField
                  fullWidth
                  multiline
                  maxRows={5}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  size="small"
                  autoFocus
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                    },
                  }}
                />
                <Box sx={{ display: "flex", gap: 0.5, mt: 1, justifyContent: "flex-end" }}>
                  <Button size="small" onClick={handleEditCancel}>
                    {t("chatbot.cancel")}
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained" 
                    onClick={handleEditSave}
                    startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
                  >
                    {t("chatbot.save")}
                  </Button>
                </Box>
              </Box>
            ) : isUser ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {message.content}
              </Typography>
            ) : (
              <>
                <MarkdownRenderer content={message.content} />
                {isMessageStreaming && (
                  <Box 
                    component="span" 
                    sx={{ 
                      display: "inline-block",
                      width: 8,
                      height: 16,
                      bgcolor: theme.palette.primary.main,
                      ml: 0.5,
                      animation: "blink 1s infinite",
                      "@keyframes blink": {
                        "0%, 50%": { opacity: 1 },
                        "51%, 100%": { opacity: 0 },
                      },
                    }} 
                  />
                )}
              </>
            )}
          </Paper>

          {/* Failed message retry button */}
          {isFailed && (
            <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography variant="caption" color="error">
                {t("chatbot.error.failedToSend")}
              </Typography>
              <Button
                size="small"
                startIcon={<RetryIcon sx={{ fontSize: 14 }} />}
                onClick={() => onRetry(message.id)}
                sx={{ minWidth: "auto", fontSize: "0.7rem", py: 0 }}
                aria-label={t("chatbot.aria.retryButton")}
              >
                {t("chatbot.retryMessage")}
              </Button>
            </Box>
          )}

          {/* Media recommendations cards */}
          {message.mediaRecommendations?.length > 0 && (
            <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
              {message.mediaRecommendations.map((media) => (
                <MediaCard
                  key={media.id}
                  media={media}
                  onAddToWatchlist={() => onAddToWatchlist(media)}
                  onClick={() => onMediaClick(media)}
                  isInWatchlist={watchlistItems.some(
                    (item) => item.mediaId?.toString() === media.id?.toString()
                  )}
                  t={t}
                />
              ))}
            </Box>
          )}
        </Box>

        {isUser && (
          <Avatar 
            sx={{ 
              width: chatbotConfigs.dimensions.avatarSize, 
              height: chatbotConfigs.dimensions.avatarSize, 
              bgcolor: theme.palette.secondary.main, 
              color: "#000", 
              flexShrink: 0 
            }}
          >
            {message.userInitial || "U"}
          </Avatar>
        )}
      </Box>
    </motion.div>
  );
});

MessageItem.displayName = "MessageItem";

/**
 * Streaming Loading Indicator Component
 */
const StreamingIndicator = memo(({ t, theme, onStop }) => (
  <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "flex-start" }} role="status" aria-live="polite">
    <Avatar sx={{ width: chatbotConfigs.dimensions.avatarSize, height: chatbotConfigs.dimensions.avatarSize, bgcolor: theme.palette.primary.main }}>
      <BotIcon sx={{ fontSize: 18 }} />
    </Avatar>
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        border: `1px solid ${theme.palette.divider}`,
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      <CircularProgress size={16} aria-hidden="true" />
      <Typography variant="body2" color="text.secondary">
        {t("chatbot.streaming")}
      </Typography>
      <Tooltip title={t("chatbot.stopGenerating")}>
        <IconButton 
          size="small" 
          onClick={onStop}
          aria-label={t("chatbot.aria.stopButton")}
          sx={{ ml: 1, p: 0.5 }}
        >
          <StopIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Paper>
  </Box>
));

StreamingIndicator.displayName = "StreamingIndicator";

/**
 * Quick Prompts Component
 */
const QuickPrompts = memo(({ onPromptClick, t, theme }) => {
  const prompts = useMemo(() => [
    t("chatbot.prompts.trending"),
    t("chatbot.prompts.thriller"),
    t("chatbot.prompts.comedy"),
    t("chatbot.prompts.watchlist"),
    t("chatbot.prompts.scifi"),
  ], [t]);

  return (
    <Box sx={{ px: 2, pb: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {prompts.map((prompt, idx) => (
        <Chip
          key={idx}
          label={prompt}
          size="small"
          onClick={() => onPromptClick(prompt)}
          sx={{
            cursor: "pointer",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
            fontSize: "0.75rem",
          }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPromptClick(prompt);
            }
          }}
        />
      ))}
    </Box>
  );
});

QuickPrompts.displayName = "QuickPrompts";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * AIChatBot - Main chatbot component
 */
const AIChatBotContent = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Redux state
  const { user } = useSelector((state) => state.user);
  const { items: watchlistItems } = useSelector((state) => state.watchlist);

  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [historyMenuAnchor, setHistoryMenuAnchor] = useState(null);
  const [localInput, setLocalInput] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  // Persistent state
  const [chatHistoryId, setChatHistoryId] = useLocalStorage(
    chatbotConfigs.storage.historyIdKey,
    null
  );

  // TanStack Query hooks
  const { data: chatSessions = [], refetch: refetchSessions } = useChatSessions();
  const {
    messages,
    isLoadingMessages,
    isSending,
    isStreaming,
    streamingMessageId,
    sendMessageStreaming,
    stopStreaming,
    retryMessage,
    editMessage,
    deleteMessage,
    setWelcomeMessage,
  } = useChatMessages(chatHistoryId, setChatHistoryId);
  
  const clearSessionMutation = useClearChatSession();
  const prefetchSession = usePrefetchChatSession();
  const clearLocalMessages = useClearLocalMessages();

  // Get welcome message from i18n
  const welcomeMessage = useMemo(() => 
    t("chatbot.welcome", { defaultValue: chatbotConfigs.defaultWelcomeMessage }),
    [t]
  );

  // Initialize welcome message when no messages exist
  useEffect(() => {
    if (messages.length === 0 && !isLoadingMessages) {
      setWelcomeMessage(welcomeMessage);
    }
  }, [messages.length, isLoadingMessages, setWelcomeMessage, welcomeMessage]);

  // Auto-scroll to latest message with debouncing
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, []);

  const debouncedScrollToBottom = useDebounce(scrollToBottom, chatbotConfigs.timing.autoScrollDelayMs);

  useEffect(() => {
    debouncedScrollToBottom();
  }, [messages.length, debouncedScrollToBottom]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming) {
      scrollToBottom();
    }
  }, [isStreaming, messages, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, chatbotConfigs.timing.focusDelayMs);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isMinimized]);

  // Show notification when minimized and new message arrives
  useEffect(() => {
    if (isMinimized && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastMessage.id !== "welcome" && lastMessage.status === "sent") {
        setHasUnread(true);
      }
    }
  }, [messages, isMinimized]);

  // Input change handler
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    if (value.length <= chatbotConfigs.messages.maxInputLength) {
      setLocalInput(value);
    }
  }, []);

  // Toggle chat visibility
  const toggleChat = useCallback(() => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen((prev) => !prev);
    }
    setHasUnread(false);
  }, [isMinimized]);

  // Minimize chat
  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
  }, []);

  // Send message handler - uses streaming
  const handleSendMessage = useCallback((messageText = localInput) => {
    const text = typeof messageText === "string" ? messageText : localInput;
    if (!text || !text.trim() || isSending) return;

    // Build conversation history for context
    const conversationHistory = messages
      .filter(m => m.status === "sent")
      .slice(-chatbotConfigs.messages.maxHistoryMessages)
      .map((m) => ({
        role: m.role === "assistant" ? "model" : m.role,
        content: m.content,
      }));

    // Send with streaming
    sendMessageStreaming({
      message: text.trim(),
      conversationHistory,
    });

    setLocalInput("");
  }, [localInput, isSending, messages, sendMessageStreaming]);

  // Form submit handler
  const handleFormSubmit = useCallback((e) => {
    e?.preventDefault();
    handleSendMessage();
  }, [handleSendMessage]);

  // Handle Enter key press
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handle quick prompt click
  const handleQuickPrompt = useCallback((prompt) => {
    if (!isSending) {
      handleSendMessage(prompt);
    }
  }, [isSending, handleSendMessage]);

  // Add to watchlist handler
  const handleAddToWatchlist = useCallback(async (media) => {
    if (!user) {
      toast.info(t("chatbot.signInForWatchlist"));
      dispatch(setAuthModalOpen(true));
      return;
    }

    const isInWatchlist = watchlistItems.some(
      (item) => item.mediaId?.toString() === media.id?.toString()
    );

    if (isInWatchlist) {
      toast.info(t("chatbot.alreadyInWatchlist"));
      return;
    }

    try {
      const { response, err } = await watchlistApi.add({
        mediaId: media.id,
        mediaType: media.mediaType,
        mediaTitle: media.title,
        mediaPoster: media.posterPath,
        mediaBackdrop: media.backdropPath,
        mediaRate: media.voteAverage,
      });

      if (response) {
        dispatch(addToWatchlist(response));
        toast.success(t("chatbot.addedToWatchlist", { title: media.title }));
      } else {
        throw new Error(err?.message || "Failed to add");
      }
    } catch (error) {
      console.error("Add to watchlist error:", error);
      toast.error(t("chatbot.failedToAdd"));
    }
  }, [user, watchlistItems, dispatch, t]);

  // Media click handler
  const handleMediaClick = useCallback((media) => {
    navigate(`/${media.mediaType}/${media.id}`);
    setIsMinimized(true);
  }, [navigate]);

  // Delete message handlers
  const handleDeleteClick = useCallback((messageId) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (messageToDelete) {
      deleteMessage(messageToDelete);
      toast.success(t("chatbot.messageDeleted"));
    }
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  }, [messageToDelete, deleteMessage, t]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  }, []);

  // Edit message handler
  const handleEditMessage = useCallback((messageId, newContent) => {
    editMessage(messageId, newContent);
    toast.success(t("chatbot.messageEdited"));
  }, [editMessage, t]);

  // Clear chat handler
  const clearChat = useCallback(async () => {
    // Stop any streaming
    stopStreaming();
    
    // Clear local state
    clearLocalMessages(chatHistoryId);
    
    // Set welcome message
    queryClient.setQueryData(CHAT_KEYS.messages(null), [{
      id: "welcome",
      role: "assistant",
      content: welcomeMessage,
      mediaRecommendations: [],
      status: "sent",
      timestamp: new Date().toISOString(),
    }]);

    // Archive old session on backend if exists
    if (chatHistoryId) {
      try {
        await clearSessionMutation.mutateAsync(chatHistoryId);
      } catch (error) {
        console.error("Error archiving old chat:", error);
      }
    }

    setChatHistoryId(null);
  }, [chatHistoryId, clearLocalMessages, clearSessionMutation, setChatHistoryId, queryClient, welcomeMessage, stopStreaming]);

  // History menu handlers
  const handleHistoryClick = useCallback((event) => {
    refetchSessions();
    setHistoryMenuAnchor(event.currentTarget);
  }, [refetchSessions]);

  const handleHistoryClose = useCallback(() => {
    setHistoryMenuAnchor(null);
  }, []);

  const handleSessionSelect = useCallback((session) => {
    setChatHistoryId(session.id);
    handleHistoryClose();
  }, [setChatHistoryId, handleHistoryClose]);

  const handleSessionHover = useCallback((session) => {
    prefetchSession(session.id);
  }, [prefetchSession]);

  // User initial for avatar
  const userInitial = useMemo(() => 
    user?.displayName?.[0]?.toUpperCase() || "U",
    [user?.displayName]
  );

  // Prepare messages with user initial
  const messagesWithInitial = useMemo(() => 
    messages.map(msg => ({
      ...msg,
      userInitial: msg.role === "user" ? userInitial : undefined,
    })),
    [messages, userInitial]
  );

  // Determine if we should show quick prompts
  const showQuickPrompts = messages.length <= 1 && !isSending;

  // Check if currently streaming (not including initial loading)
  const showStreamingIndicator = isStreaming && !messagesWithInitial.some(m => m.status === "streaming");

  return (
    <>
      {/* Floating Action Button */}
      <Zoom in={!isOpen || isMinimized}>
        <Tooltip title={t("chatbot.aria.openChat")} placement="left">
          <Badge
            color="error"
            variant="dot"
            invisible={!hasUnread}
            sx={{ 
              position: "fixed", 
              bottom: { xs: 80, sm: 24 }, 
              right: 24, 
              zIndex: 1200 
            }}
          >
            <Fab
              onClick={toggleChat}
              aria-label={t("chatbot.aria.openChat")}
              sx={{
                width: chatbotConfigs.dimensions.fabSize,
                height: chatbotConfigs.dimensions.fabSize,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: "#fff",
                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                "&:hover": {
                  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                  transform: "scale(1.05)",
                  boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.5)}`,
                },
                transition: "all 0.3s ease",
              }}
            >
              <BotIcon sx={{ fontSize: 28 }} />
            </Fab>
          </Badge>
        </Tooltip>
      </Zoom>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <Slide direction="up" in={isOpen && !isMinimized} mountOnEnter unmountOnExit>
            <Paper
              component={motion.div}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: chatbotConfigs.timing.animationDurationMs / 1000 }}
              elevation={8}
              role="dialog"
              aria-label={t("chatbot.aria.chatWindow")}
              aria-modal="true"
              sx={{
                position: "fixed",
                bottom: { xs: 0, sm: 24 },
                right: { xs: 0, sm: 24 },
                width: chatbotConfigs.dimensions.chatWidth,
                height: chatbotConfigs.dimensions.chatHeight,
                maxHeight: chatbotConfigs.dimensions.maxChatHeight,
                borderRadius: { xs: 0, sm: 3 },
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                zIndex: 1300,
                bgcolor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  p: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: alpha("#fff", 0.2) }}>
                    <BotIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t("chatbot.title")}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      {isStreaming ? t("chatbot.streaming") : t("chatbot.subtitle")}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Tooltip title={t("chatbot.aria.historyButton")}>
                    <IconButton 
                      size="small" 
                      onClick={handleHistoryClick} 
                      sx={{ color: "#fff", mr: 0.5 }}
                      aria-label={t("chatbot.aria.historyButton")}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("chatbot.aria.newChatButton")}>
                    <IconButton 
                      size="small" 
                      onClick={clearChat} 
                      sx={{ color: "#fff", mr: 0.5 }}
                      aria-label={t("chatbot.aria.newChatButton")}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("chatbot.aria.minimizeButton")}>
                    <IconButton 
                      size="small" 
                      onClick={minimizeChat} 
                      sx={{ color: "#fff", mr: 0.5 }}
                      aria-label={t("chatbot.aria.minimizeButton")}
                    >
                      <MinimizeIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("chatbot.aria.closeButton")}>
                    <IconButton 
                      size="small" 
                      onClick={() => setIsOpen(false)} 
                      sx={{ color: "#fff" }}
                      aria-label={t("chatbot.aria.closeButton")}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* History Menu */}
              <Menu
                anchorEl={historyMenuAnchor}
                open={Boolean(historyMenuAnchor)}
                onClose={handleHistoryClose}
                PaperProps={{ sx: { maxHeight: 300, width: 280 } }}
              >
                {chatSessions.length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      {t("chatbot.noHistory")}
                    </Typography>
                  </MenuItem>
                ) : (
                  chatSessions.map((session) => (
                    <MenuItem
                      key={session.id}
                      onClick={() => handleSessionSelect(session)}
                      onMouseEnter={() => handleSessionHover(session)}
                      sx={{ py: 1 }}
                    >
                      <ListItemText
                        primary={session.title}
                        secondary={t("chatbot.messagesCount", { count: session.messageCount })}
                        primaryTypographyProps={{ noWrap: true, variant: "body2" }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                    </MenuItem>
                  ))
                )}
              </Menu>

              {/* Messages Area */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  p: 2,
                  background: theme.palette.mode === "dark"
                    ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.5)} 0%, ${theme.palette.background.default} 100%)`
                    : theme.palette.background.default,
                }}
                role="log"
                aria-label={t("chatbot.aria.messageList")}
                aria-live="polite"
              >
                {messagesWithInitial.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    watchlistItems={watchlistItems}
                    onAddToWatchlist={handleAddToWatchlist}
                    onMediaClick={handleMediaClick}
                    onRetry={retryMessage}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteClick}
                    isStreaming={message.id === streamingMessageId}
                    t={t}
                    theme={theme}
                  />
                ))}

                {/* Streaming indicator (when starting a new response) */}
                {showStreamingIndicator && (
                  <StreamingIndicator t={t} theme={theme} onStop={stopStreaming} />
                )}

                <div ref={messagesEndRef} />
              </Box>

              {/* Quick prompts */}
              {showQuickPrompts && (
                <QuickPrompts 
                  onPromptClick={handleQuickPrompt} 
                  t={t} 
                  theme={theme} 
                />
              )}

              {/* Input Area */}
              <Box
                component="form"
                onSubmit={handleFormSubmit}
                sx={{ 
                  p: 2, 
                  pt: 1, 
                  borderTop: `1px solid ${theme.palette.divider}`, 
                  bgcolor: theme.palette.background.paper 
                }}
              >
                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                  <TextField
                    inputRef={inputRef}
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder={t("chatbot.placeholder")}
                    value={localInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                    size="small"
                    autoComplete="off"
                    inputProps={{
                      "aria-label": t("chatbot.aria.input"),
                      maxLength: chatbotConfigs.messages.maxInputLength,
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.background.default, 0.5),
                      },
                    }}
                  />
                  {isStreaming ? (
                    <Tooltip title={t("chatbot.stopGenerating")}>
                      <IconButton
                        onClick={stopStreaming}
                        aria-label={t("chatbot.aria.stopButton")}
                        sx={{
                          bgcolor: theme.palette.error.main,
                          color: "#fff",
                          "&:hover": { bgcolor: theme.palette.error.dark },
                        }}
                      >
                        <StopIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title={t("chatbot.aria.sendButton")}>
                      <span>
                        <IconButton
                          type="submit"
                          disabled={!localInput.trim() || isSending}
                          aria-label={t("chatbot.aria.sendButton")}
                          sx={{
                            bgcolor: theme.palette.primary.main,
                            color: "#fff",
                            "&:hover": { bgcolor: theme.palette.primary.dark },
                            "&:disabled": {
                              bgcolor: theme.palette.action.disabledBackground,
                              color: theme.palette.action.disabled,
                            },
                          }}
                        >
                          <SendIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ mt: 1, display: "block", textAlign: "center" }}
                >
                  {t("chatbot.poweredBy")} • {user ? t("chatbot.signedIn") : t("chatbot.signInPrompt")}
                </Typography>
              </Box>
            </Paper>
          </Slide>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {t("chatbot.deleteConfirm")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {t("chatbot.deleteConfirmText")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            {t("chatbot.cancel")}
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            {t("chatbot.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/**
 * AIChatBot - Wrapped with Error Boundary
 */
const AIChatBot = () => {
  const { t } = useTranslation();
  
  return (
    <ChatbotErrorBoundary t={t}>
      <AIChatBotContent />
    </ChatbotErrorBoundary>
  );
};

export default AIChatBot;
