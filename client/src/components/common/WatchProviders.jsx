/**
 * Watch Providers Component
 * Shows where to stream, rent, or buy media (like JustWatch)
 * Supports region selection and provider deep links
 */

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Avatar,
  Tooltip,
  Tab,
  Tabs,
  Paper,
  Link,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import MovieIcon from "@mui/icons-material/Movie";
import PublicIcon from "@mui/icons-material/Public";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import tmdbConfigs from "../../api/configs/tmdb.configs";

// Extended list of regions with names
const REGIONS = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
];

/**
 * Provider Logo Component
 */
const ProviderLogo = ({ provider, size = 48 }) => (
  <Tooltip
    title={
      <Box>
        <Typography variant="subtitle2">{provider.provider_name}</Typography>
      </Box>
    }
    arrow
    placement="top"
  >
    <Avatar
      src={tmdbConfigs.posterPath(provider.logo_path)}
      alt={provider.provider_name}
      sx={{
        width: size,
        height: size,
        borderRadius: "12px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        "&:hover": {
          transform: "scale(1.1) translateY(-2px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        },
      }}
    />
  </Tooltip>
);

/**
 * Provider Section Component
 */
const ProviderSection = ({ title, icon, providers, color, emptyMessage }) => {
  if (!providers || providers.length === 0) {
    if (emptyMessage) {
      return (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            {icon}
            <Typography variant="subtitle2" fontWeight={600} color={color}>
              {title}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      );
    }
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        {icon}
        <Typography variant="subtitle2" fontWeight={600} color={color}>
          {title}
        </Typography>
        <Chip
          label={providers.length}
          size="small"
          sx={{ height: 20, fontSize: "0.7rem" }}
        />
      </Stack>
      <Stack direction="row" flexWrap="wrap" gap={1.5}>
        {providers.map((provider) => (
          <ProviderLogo key={provider.provider_id} provider={provider} />
        ))}
      </Stack>
    </Box>
  );
};

/**
 * Loading Skeleton for providers
 */
const ProvidersSkeleton = () => (
  <Box>
    <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} variant="rounded" width={48} height={48} />
      ))}
    </Stack>
    <Stack direction="row" spacing={1.5}>
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} variant="rounded" width={48} height={48} />
      ))}
    </Stack>
  </Box>
);

/**
 * Main Watch Providers Component
 */
const WatchProviders = ({
  providers,
  allRegions = [],
  onRegionChange,
  loading = false,
}) => {
  const [selectedRegion, setSelectedRegion] = useState("US");
  const [activeTab, setActiveTab] = useState(0);

  // Get available regions from the provided list
  const availableRegions = useMemo(() => {
    return REGIONS.filter((r) => allRegions.includes(r.code));
  }, [allRegions]);

  // Auto-select first available region if current is not available
  useEffect(() => {
    if (availableRegions.length > 0 && !allRegions.includes(selectedRegion)) {
      setSelectedRegion(availableRegions[0].code);
    }
  }, [availableRegions, allRegions, selectedRegion]);

  const handleRegionChange = (event) => {
    const newRegion = event.target.value;
    setSelectedRegion(newRegion);
    if (onRegionChange) {
      onRegionChange(newRegion);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Paper
        sx={{
          p: 3,
          backgroundColor: "background.paper",
          borderRadius: 2,
        }}
      >
        <ProvidersSkeleton />
      </Paper>
    );
  }

  // No providers available
  if (!providers) {
    return (
      <Paper
        sx={{
          p: 3,
          textAlign: "center",
          backgroundColor: "background.paper",
          borderRadius: 2,
        }}
      >
        <MovieIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
        <Typography color="text.secondary">
          No streaming information available for this region.
        </Typography>
        {availableRegions.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Try another region</InputLabel>
              <Select
                value={selectedRegion}
                label="Try another region"
                onChange={handleRegionChange}
              >
                {availableRegions.map((region) => (
                  <MenuItem key={region.code} value={region.code}>
                    {region.flag} {region.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Paper>
    );
  }

  const hasStream = providers.flatrate?.length > 0;
  const hasRent = providers.rent?.length > 0;
  const hasBuy = providers.buy?.length > 0;
  const hasFree = providers.free?.length > 0;
  const hasAds = providers.ads?.length > 0;

  const tabs = [];
  if (hasStream) tabs.push({ label: "Stream", value: "stream", count: providers.flatrate.length });
  if (hasFree || hasAds) tabs.push({ label: "Free", value: "free", count: (providers.free?.length || 0) + (providers.ads?.length || 0) });
  if (hasRent) tabs.push({ label: "Rent", value: "rent", count: providers.rent.length });
  if (hasBuy) tabs.push({ label: "Buy", value: "buy", count: providers.buy.length });

  // If no tabs, show a message
  if (tabs.length === 0) {
    return (
      <Paper
        sx={{
          p: 3,
          textAlign: "center",
          backgroundColor: "background.paper",
          borderRadius: 2,
        }}
      >
        <MovieIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
        <Typography color="text.secondary">
          No streaming options available in {REGIONS.find(r => r.code === selectedRegion)?.name || selectedRegion}.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        backgroundColor: "background.paper",
        borderRadius: 2,
      }}
    >
      {/* Header with Region Selector */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <PublicIcon sx={{ color: "text.secondary" }} />
          <Typography variant="h6" fontWeight={600}>
            Where to Watch
          </Typography>
        </Stack>

        {availableRegions.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Region</InputLabel>
            <Select
              value={selectedRegion}
              label="Region"
              onChange={handleRegionChange}
            >
              {availableRegions.map((region) => (
                <MenuItem key={region.code} value={region.code}>
                  {region.flag} {region.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      {/* Tabs for different provider types */}
      {tabs.length > 1 && (
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              label={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <span>{tab.label}</span>
                  <Chip
                    label={tab.count}
                    size="small"
                    sx={{ height: 18, fontSize: "0.65rem", ml: 0.5 }}
                  />
                </Stack>
              }
            />
          ))}
        </Tabs>
      )}

      {/* Provider Content */}
      <Box>
        {tabs[activeTab]?.value === "stream" && (
          <ProviderSection
            title="Available on Streaming"
            icon={<PlayArrowIcon sx={{ color: "success.main" }} />}
            providers={providers.flatrate}
            color="success.main"
          />
        )}

        {tabs[activeTab]?.value === "free" && (
          <>
            <ProviderSection
              title="Watch Free"
              icon={<PlayArrowIcon sx={{ color: "success.light" }} />}
              providers={providers.free}
              color="success.light"
            />
            {hasAds && (
              <ProviderSection
                title="Free with Ads"
                icon={<PlayArrowIcon sx={{ color: "info.main" }} />}
                providers={providers.ads}
                color="info.main"
              />
            )}
          </>
        )}

        {tabs[activeTab]?.value === "rent" && (
          <ProviderSection
            title="Available for Rent"
            icon={<MovieIcon sx={{ color: "info.main" }} />}
            providers={providers.rent}
            color="info.main"
          />
        )}

        {tabs[activeTab]?.value === "buy" && (
          <ProviderSection
            title="Available for Purchase"
            icon={<ShoppingCartIcon sx={{ color: "warning.main" }} />}
            providers={providers.buy}
            color="warning.main"
          />
        )}

        {/* Show all if only one category */}
        {tabs.length === 1 && (
          <>
            {hasStream && (
              <ProviderSection
                title="Stream"
                icon={<PlayArrowIcon sx={{ color: "success.main" }} />}
                providers={providers.flatrate}
                color="success.main"
              />
            )}
            {hasFree && (
              <ProviderSection
                title="Free"
                icon={<PlayArrowIcon sx={{ color: "success.light" }} />}
                providers={providers.free}
                color="success.light"
              />
            )}
            {hasAds && (
              <ProviderSection
                title="Free with Ads"
                icon={<PlayArrowIcon sx={{ color: "info.main" }} />}
                providers={providers.ads}
                color="info.main"
              />
            )}
            {hasRent && (
              <ProviderSection
                title="Rent"
                icon={<MovieIcon sx={{ color: "info.main" }} />}
                providers={providers.rent}
                color="info.main"
              />
            )}
            {hasBuy && (
              <ProviderSection
                title="Buy"
                icon={<ShoppingCartIcon sx={{ color: "warning.main" }} />}
                providers={providers.buy}
                color="warning.main"
              />
            )}
          </>
        )}
      </Box>

      {/* Attribution */}
      {providers.link && (
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Link
            href={providers.link}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: "0.75rem",
              color: "text.secondary",
              textDecoration: "none",
              "&:hover": { 
                textDecoration: "underline",
                color: "primary.main",
              },
            }}
          >
            <Typography variant="caption">
              View all options on JustWatch
            </Typography>
            <OpenInNewIcon sx={{ fontSize: 14 }} />
          </Link>
        </Box>
      )}
    </Paper>
  );
};

/**
 * Compact Watch Providers (for cards)
 */
export const CompactWatchProviders = ({ providers, maxShow = 4 }) => {
  const streamingProviders = providers?.flatrate || [];
  
  if (streamingProviders.length === 0) return null;

  const displayProviders = streamingProviders.slice(0, maxShow);
  const remaining = streamingProviders.length - maxShow;

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
            Available on:
          </Typography>
          {streamingProviders.map((p) => (
            <Typography key={p.provider_id} variant="caption" display="block">
              • {p.provider_name}
            </Typography>
          ))}
        </Box>
      }
      arrow
    >
      <Stack direction="row" spacing={0.5} alignItems="center">
        {displayProviders.map((provider) => (
          <Avatar
            key={provider.provider_id}
            src={tmdbConfigs.posterPath(provider.logo_path)}
            alt={provider.provider_name}
            sx={{
              width: 24,
              height: 24,
              borderRadius: "6px",
            }}
          />
        ))}
        {remaining > 0 && (
          <Chip
            label={`+${remaining}`}
            size="small"
            sx={{ height: 24, fontSize: "0.7rem", borderRadius: "6px" }}
          />
        )}
      </Stack>
    </Tooltip>
  );
};

export default WatchProviders;
