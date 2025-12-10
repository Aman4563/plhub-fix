/**
 * Admin Panel - Main Dashboard
 * Netflix-inspired admin interface with comprehensive user management
 */

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Stack,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Badge,
  Divider,
  Alert,
  Skeleton,
  useTheme,
  alpha,
} from "@mui/material";
import { toast } from "react-toastify";

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import GavelIcon from "@mui/icons-material/Gavel";
import HistoryIcon from "@mui/icons-material/History";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SecurityIcon from "@mui/icons-material/Security";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import GroupIcon from "@mui/icons-material/Group";
import RateReviewIcon from "@mui/icons-material/RateReview";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

import Container from "../../components/common/Container";
import uiConfigs from "../../configs/ui.configs";
import adminApi from "../../api/modules/admin.api";

// ==================== STAT CARD COMPONENT ====================

const StatCard = ({ title, value, icon, color, trend, trendValue, loading }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Paper
        sx={{
          p: 3,
          height: "100%",
          background: `linear-gradient(135deg, ${alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
          border: `1px solid ${alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.2)}`,
        }}
      >
        <Stack spacing={2}>
          <Skeleton variant="circular" width={48} height={48} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={40} />
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        height: "100%",
        background: `linear-gradient(135deg, ${alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.2)}`,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px ${alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.25)}`,
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight={700}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </Typography>
          {trend && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
              {trend === "up" ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: "success.main" }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: "error.main" }} />
              )}
              <Typography
                variant="caption"
                color={trend === "up" ? "success.main" : "error.main"}
              >
                {trendValue}
              </Typography>
            </Stack>
          )}
        </Box>
        <Avatar
          sx={{
            bgcolor: alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.2),
            color: theme.palette[color]?.main || theme.palette.primary.main,
            width: 56,
            height: 56,
          }}
        >
          {icon}
        </Avatar>
      </Stack>
    </Paper>
  );
};

// ==================== USER DETAILS DIALOG ====================

const UserDetailsDialog = ({ open, onClose, userId, onAction }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    if (open && userId) {
      fetchUserDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    const { response, err } = await adminApi.getUserDetails(userId);
    if (response) {
      setUser(response);
    } else if (err) {
      toast.error(err.message || "Failed to load user details");
    }
    setLoading(false);
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: "error",
      moderator: "warning",
      user: "default",
    };
    return <Chip label={role} size="small" color={colors[role] || "default"} />;
  };

  const getStatusBadge = (user) => {
    if (user?.isPermanentlyBanned) {
      return <Chip label="Banned" size="small" color="error" />;
    }
    if (user?.isSuspended) {
      return <Chip label="Suspended" size="small" color="warning" />;
    }
    return <Chip label="Active" size="small" color="success" />;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">User Details</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack spacing={2}>
            <Skeleton variant="circular" width={80} height={80} />
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="rectangular" height={120} />
          </Stack>
        ) : user ? (
          <Grid container spacing={3}>
            {/* User Profile Section */}
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: "center",
                  background: alpha(theme.palette.primary.main, 0.05),
                }}
              >
                <Avatar
                  src={user.avatar}
                  sx={{
                    width: 100,
                    height: 100,
                    mx: "auto",
                    mb: 2,
                    bgcolor: "primary.main",
                    fontSize: 40,
                  }}
                >
                  {user.displayName?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6">{user.displayName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  @{user.username}
                </Typography>
                <Typography variant="caption" color="text.disabled" display="block">
                  {user.email}
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                  {getRoleBadge(user.role)}
                  {getStatusBadge(user)}
                </Stack>
              </Paper>
            </Grid>

            {/* Stats & Info Section */}
            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                {/* Quick Stats */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Activity Stats
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="h5" color="primary">
                        {user.stats?.totalReviews || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reviews
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="h5" color="success.main">
                        {user.stats?.totalHelpfulVotes || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Helpful Votes
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography
                        variant="h5"
                        color={user.stats?.activeWarnings > 0 ? "warning.main" : "text.primary"}
                      >
                        {user.stats?.activeWarnings || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Active Warnings
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Dates */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Account Info
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Joined
                      </Typography>
                      <Typography variant="body2">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Last Login
                      </Typography>
                      <Typography variant="body2">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : "Never"}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Warnings */}
                {user.warnings?.length > 0 && (
                  <Paper sx={{ p: 2, border: `1px solid ${theme.palette.warning.main}` }}>
                    <Typography variant="subtitle2" color="warning.main" gutterBottom>
                      Warnings ({user.warnings.length})
                    </Typography>
                    <Stack spacing={1} sx={{ maxHeight: 150, overflow: "auto" }}>
                      {user.warnings.map((warning, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between">
                            <Chip
                              label={warning.severity}
                              size="small"
                              color={
                                warning.severity === "severe"
                                  ? "error"
                                  : warning.severity === "moderate"
                                  ? "warning"
                                  : "default"
                              }
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(warning.issuedAt).toLocaleDateString()}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {warning.reason}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="error">Failed to load user details</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {user && (
          <>
            <Button
              startIcon={<WarningAmberIcon />}
              color="warning"
              onClick={() => {
                onClose();
                onAction("warn", user);
              }}
            >
              Issue Warning
            </Button>
            {!user.isSuspended && !user.isPermanentlyBanned && (
              <Button
                startIcon={<BlockIcon />}
                color="error"
                onClick={() => {
                  onClose();
                  onAction("suspend", user);
                }}
              >
                Suspend
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ==================== ACTION DIALOGS ====================

const WarningDialog = ({ open, onClose, user, onSubmit }) => {
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState("minor");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setSubmitting(true);
    const { response, err } = await adminApi.issueWarning({
      userId: user.id || user._id,
      reason,
      severity,
    });

    if (response) {
      toast.success("Warning issued successfully");
      onSubmit();
      onClose();
    } else if (err) {
      toast.error(err.message || "Failed to issue warning");
    }
    setSubmitting(false);
  };

  useEffect(() => {
    if (open) {
      setReason("");
      setSeverity("minor");
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <WarningAmberIcon color="warning" />
          <Typography>Issue Warning to {user?.displayName}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Severity</InputLabel>
            <Select
              value={severity}
              label="Severity"
              onChange={(e) => setSeverity(e.target.value)}
            >
              <MenuItem value="minor">Minor</MenuItem>
              <MenuItem value="moderate">Moderate</MenuItem>
              <MenuItem value="severe">Severe</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Reason"
            multiline
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this warning is being issued..."
            required
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleSubmit}
          disabled={submitting || !reason.trim()}
        >
          {submitting ? "Issuing..." : "Issue Warning"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SuspendDialog = ({ open, onClose, user, onSubmit }) => {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(24);
  const [indefinite, setIndefinite] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setSubmitting(true);
    const { response, err } = await adminApi.suspendUser({
      userId: user.id || user._id,
      reason,
      duration: indefinite ? null : duration,
    });

    if (response) {
      toast.success("User suspended successfully");
      onSubmit();
      onClose();
    } else if (err) {
      toast.error(err.message || "Failed to suspend user");
    }
    setSubmitting(false);
  };

  useEffect(() => {
    if (open) {
      setReason("");
      setDuration(24);
      setIndefinite(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <BlockIcon color="error" />
          <Typography>Suspend {user?.displayName}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Duration</InputLabel>
            <Select
              value={indefinite ? "indefinite" : duration}
              label="Duration"
              onChange={(e) => {
                if (e.target.value === "indefinite") {
                  setIndefinite(true);
                } else {
                  setIndefinite(false);
                  setDuration(e.target.value);
                }
              }}
            >
              <MenuItem value={1}>1 Hour</MenuItem>
              <MenuItem value={6}>6 Hours</MenuItem>
              <MenuItem value={24}>24 Hours</MenuItem>
              <MenuItem value={72}>3 Days</MenuItem>
              <MenuItem value={168}>1 Week</MenuItem>
              <MenuItem value={720}>30 Days</MenuItem>
              <MenuItem value="indefinite">Indefinite</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Reason"
            multiline
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this user is being suspended..."
            required
          />
          <Alert severity="warning">
            This will immediately log out the user and prevent them from accessing the
            platform until the suspension expires.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={submitting || !reason.trim()}
        >
          {submitting ? "Suspending..." : "Suspend User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RoleDialog = ({ open, onClose, user, onSubmit, currentUserRole }) => {
  const [role, setRole] = useState(user?.role || "user");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const { response, err } = await adminApi.updateUserRole({
      userId: user.id || user._id,
      role,
      reason,
    });

    if (response) {
      toast.success(`Role updated to ${role}`);
      onSubmit();
      onClose();
    } else if (err) {
      toast.error(err.message || "Failed to update role");
    }
    setSubmitting(false);
  };

  useEffect(() => {
    if (open && user) {
      setRole(user.role);
      setReason("");
    }
  }, [open, user]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AdminPanelSettingsIcon color="primary" />
          <Typography>Change Role for {user?.displayName}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
              <MenuItem value="user">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PersonIcon fontSize="small" />
                  <span>User</span>
                </Stack>
              </MenuItem>
              <MenuItem value="moderator">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SecurityIcon fontSize="small" color="warning" />
                  <span>Moderator</span>
                </Stack>
              </MenuItem>
              {currentUserRole === "admin" && (
                <MenuItem value="admin">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AdminPanelSettingsIcon fontSize="small" color="error" />
                    <span>Admin</span>
                  </Stack>
                </MenuItem>
              )}
            </Select>
          </FormControl>
          <TextField
            label="Reason (optional)"
            multiline
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this role being changed?"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || role === user?.role}
        >
          {submitting ? "Updating..." : "Update Role"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==================== MAIN ADMIN PANEL ====================

const AdminPanel = () => {
  const theme = useTheme();
  const { user: currentUser } = useSelector((state) => state.user);

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);

  // Pagination & Filters
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Menu & Dialogs
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [warningDialog, setWarningDialog] = useState(false);
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    const { response, err } = await adminApi.getDashboardStats();
    if (response) {
      setStats(response);
    } else if (err) {
      toast.error(err.message || "Failed to load dashboard stats");
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    const { response, err } = await adminApi.getAllUsers({
      page: page + 1,
      limit: rowsPerPage,
      search: searchQuery || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    if (response) {
      setUsers(response.users || []);
      setTotalUsers(response.pagination?.total || 0);
    } else if (err) {
      toast.error(err.message || "Failed to load users");
    }
    setUsersLoading(false);
  }, [page, rowsPerPage, searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchStats();
      await fetchUsers();
      setLoading(false);
    };
    init();
  }, [fetchStats, fetchUsers]);

  useEffect(() => {
    if (activeTab === 1) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, rowsPerPage, searchQuery, roleFilter, statusFilter]);

  const handleMenuOpen = (event, user) => {
    setSelectedUser(user);
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleAction = (action, user) => {
    setSelectedUser(user || selectedUser);
    handleMenuClose();

    switch (action) {
      case "view":
        setDetailsDialog(true);
        break;
      case "warn":
        setWarningDialog(true);
        break;
      case "suspend":
        setSuspendDialog(true);
        break;
      case "unsuspend":
        handleUnsuspend(user || selectedUser);
        break;
      case "role":
        setRoleDialog(true);
        break;
      case "ban":
        handleBan(user || selectedUser);
        break;
      case "unban":
        handleUnban(user || selectedUser);
        break;
      default:
        break;
    }
  };

  const handleUnsuspend = async (user) => {
    const { response, err } = await adminApi.unsuspendUser({
      userId: user.id || user._id,
      reason: "Suspension lifted",
    });

    if (response) {
      toast.success("User unsuspended");
      fetchUsers();
    } else if (err) {
      toast.error(err.message || "Failed to unsuspend user");
    }
  };

  const handleBan = async (user) => {
    const reason = prompt("Enter ban reason:");
    if (!reason) return;

    const { response, err } = await adminApi.banUser({
      userId: user.id || user._id,
      reason,
    });

    if (response) {
      toast.success("User banned permanently");
      fetchUsers();
    } else if (err) {
      toast.error(err.message || "Failed to ban user");
    }
  };

  const handleUnban = async (user) => {
    const { response, err } = await adminApi.unbanUser({
      userId: user.id || user._id,
      reason: "Ban lifted",
    });

    if (response) {
      toast.success("User unbanned");
      fetchUsers();
    } else if (err) {
      toast.error(err.message || "Failed to unban user");
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <AdminPanelSettingsIcon fontSize="small" color="error" />;
      case "moderator":
        return <SecurityIcon fontSize="small" color="warning" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  const getUserStatus = (user) => {
    if (user.isPermanentlyBanned) {
      return { label: "Banned", color: "error" };
    }
    if (user.isSuspended) {
      return { label: "Suspended", color: "warning" };
    }
    return { label: "Active", color: "success" };
  };

  // ==================== RENDER TABS ====================

  const renderDashboard = () => (
    <Stack spacing={4}>
      {/* Stats Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats?.users?.total || 0}
            icon={<GroupIcon />}
            color="primary"
            trend="up"
            trendValue={`+${stats?.users?.newThisWeek || 0} this week`}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="New Today"
            value={stats?.users?.newToday || 0}
            icon={<TrendingUpIcon />}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Reviews"
            value={stats?.reviews?.pendingModeration || 0}
            icon={<RateReviewIcon />}
            color="warning"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Warnings"
            value={stats?.moderation?.activeWarnings || 0}
            icon={<ReportProblemIcon />}
            color="error"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Secondary Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Roles Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AdminPanelSettingsIcon color="error" />
                  <Typography>Admins</Typography>
                </Stack>
                <Typography variant="h6">{stats?.users?.roles?.admin || 0}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SecurityIcon color="warning" />
                  <Typography>Moderators</Typography>
                </Stack>
                <Typography variant="h6">{stats?.users?.roles?.moderator || 0}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PersonIcon />
                  <Typography>Users</Typography>
                </Stack>
                <Typography variant="h6">{stats?.users?.roles?.user || 0}</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Moderation Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CheckCircleIcon color="success" />
                  <Typography>Active Users</Typography>
                </Stack>
                <Typography variant="h6">
                  {(stats?.users?.total || 0) -
                    (stats?.users?.suspended || 0) -
                    (stats?.users?.banned || 0)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <BlockIcon color="warning" />
                  <Typography>Suspended Users</Typography>
                </Stack>
                <Typography variant="h6">{stats?.users?.suspended || 0}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <BlockIcon color="error" />
                  <Typography>Banned Users</Typography>
                </Stack>
                <Typography variant="h6">{stats?.users?.banned || 0}</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );

  const renderUserManagement = () => (
    <Stack spacing={3}>
      {/* Filters */}
      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
        >
          <TextField
            size="small"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="moderator">Moderator</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="banned">Banned</MenuItem>
            </Select>
          </FormControl>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
            disabled={usersLoading}
          >
            Refresh
          </Button>
        </Stack>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Warnings</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usersLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Stack>
                        <Skeleton width={120} />
                        <Skeleton width={80} />
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Skeleton width={80} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={60} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={30} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={80} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={30} />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <PeopleIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                  <Typography color="text.secondary">No users found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const status = getUserStatus(user);
                const userId = user.id || user._id;

                return (
                  <TableRow
                    key={userId}
                    sx={{
                      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar src={user.avatar} sx={{ bgcolor: "primary.main" }}>
                          {user.displayName?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Stack>
                          <Typography variant="body2" fontWeight={500}>
                            {user.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{user.username}
                          </Typography>
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {getRoleIcon(user.role)}
                        <Typography variant="body2">{user.role}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        size="small"
                        color={status.color}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        badgeContent={user.activeWarnings || 0}
                        color="warning"
                        showZero={false}
                      >
                        <WarningAmberIcon
                          color={user.activeWarnings > 0 ? "warning" : "disabled"}
                        />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, user)}
                          disabled={userId === (currentUser?.id || currentUser?._id)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
    </Stack>
  );

  return (
    <Box sx={{ ...uiConfigs.style.mainContent }}>
      <Container header="Admin Panel">
        {/* Header with Role Badge */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                bgcolor: isAdmin ? "error.main" : "warning.main",
                width: 48,
                height: 48,
              }}
            >
              {isAdmin ? <AdminPanelSettingsIcon /> : <SecurityIcon />}
            </Avatar>
            <Stack>
              <Typography variant="h6">
                Welcome, {currentUser?.displayName}
              </Typography>
              <Chip
                label={currentUser?.role?.toUpperCase()}
                size="small"
                color={isAdmin ? "error" : "warning"}
              />
            </Stack>
          </Stack>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchStats();
              if (activeTab === 1) fetchUsers();
            }}
          >
            Refresh
          </Button>
        </Stack>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<DashboardIcon />}
              label="Dashboard"
              iconPosition="start"
            />
            <Tab
              icon={<PeopleIcon />}
              label="User Management"
              iconPosition="start"
            />
            <Tab
              icon={<GavelIcon />}
              label="Moderation"
              iconPosition="start"
              disabled
            />
            <Tab
              icon={<HistoryIcon />}
              label="Activity Log"
              iconPosition="start"
              disabled
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {activeTab === 0 && renderDashboard()}
        {activeTab === 1 && renderUserManagement()}

        {/* User Action Menu */}
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
          <MenuItem onClick={() => handleAction("view")}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleAction("warn")}>
            <ListItemIcon>
              <WarningAmberIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Issue Warning</ListItemText>
          </MenuItem>
          {selectedUser?.isSuspended ? (
            <MenuItem onClick={() => handleAction("unsuspend")}>
              <ListItemIcon>
                <LockOpenIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Unsuspend</ListItemText>
            </MenuItem>
          ) : (
            <MenuItem onClick={() => handleAction("suspend")}>
              <ListItemIcon>
                <BlockIcon fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText>Suspend</ListItemText>
            </MenuItem>
          )}
          {isAdmin && (
            <>
              <Divider />
              <MenuItem onClick={() => handleAction("role")}>
                <ListItemIcon>
                  <AdminPanelSettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Change Role</ListItemText>
              </MenuItem>
              {selectedUser?.isPermanentlyBanned ? (
                <MenuItem onClick={() => handleAction("unban")}>
                  <ListItemIcon>
                    <LockOpenIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText>Unban</ListItemText>
                </MenuItem>
              ) : (
                <MenuItem onClick={() => handleAction("ban")} sx={{ color: "error.main" }}>
                  <ListItemIcon>
                    <BlockIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>Permanent Ban</ListItemText>
                </MenuItem>
              )}
            </>
          )}
        </Menu>

        {/* Dialogs */}
        <UserDetailsDialog
          open={detailsDialog}
          onClose={() => setDetailsDialog(false)}
          userId={selectedUser?.id || selectedUser?._id}
          onAction={handleAction}
        />
        <WarningDialog
          open={warningDialog}
          onClose={() => setWarningDialog(false)}
          user={selectedUser}
          onSubmit={fetchUsers}
        />
        <SuspendDialog
          open={suspendDialog}
          onClose={() => setSuspendDialog(false)}
          user={selectedUser}
          onSubmit={fetchUsers}
        />
        <RoleDialog
          open={roleDialog}
          onClose={() => setRoleDialog(false)}
          user={selectedUser}
          onSubmit={fetchUsers}
          currentUserRole={currentUser?.role}
        />
      </Container>
    </Box>
  );
};

export default AdminPanel;

