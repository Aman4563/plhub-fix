# Redis Setup Guide for PLHub

Redis is used for API response caching in PLHub. It's **optional** - the application will automatically fall back to in-memory caching if Redis is not available.

## Why Use Redis?

| Feature | In-Memory Cache | Redis |
|---------|-----------------|-------|
| Persistence | Lost on restart | Persists across restarts |
| Scalability | Single instance only | Shared across multiple instances |
| Memory | Uses Node.js heap | Separate process |
| Speed | Fastest | Very fast |
| Cost | Free | Free tier available |

**Recommendation**: Use Redis in production for better scalability and persistence.

---

## Quick Setup Options

### Option 1: Local Development (No Redis)

No setup needed! PLHub automatically uses in-memory caching when Redis is not configured.

```bash
# Just start the server - it will use memory cache
npm run start
```

You'll see this message in logs:
```
Cache: Using in-memory cache (Redis not configured)
```

---

### Option 2: Local Redis Installation

#### Windows

**Using Chocolatey:**
```powershell
choco install redis-64
```

**Using WSL (Recommended):**
```bash
# Install Redis in WSL
sudo apt update
sudo apt install redis-server

# Start Redis
sudo service redis-server start

# Verify it's running
redis-cli ping
# Should return: PONG
```

**Using Docker:**
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

#### macOS

```bash
# Using Homebrew
brew install redis

# Start Redis
brew services start redis

# Verify
redis-cli ping
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping
```

---

### Option 3: Cloud Redis (Production Recommended)

#### Upstash (Recommended - Free Tier)

1. Go to [upstash.com](https://upstash.com)
2. Create a free account
3. Create a new Redis database
4. Copy the connection URL

**Free Tier Includes:**
- 10,000 commands/day
- 256MB storage
- No credit card required

#### Redis Cloud

1. Go to [redis.com/try-free](https://redis.com/try-free/)
2. Create a free account
3. Create a database
4. Get the connection URL

**Free Tier Includes:**
- 30MB storage
- Shared infrastructure

#### Railway

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add Redis plugin
4. Copy the connection URL from variables

---

## Configuration

### Environment Variable

Add the Redis URL to your `.env` file:

```env
# Local Redis
REDIS_URL=redis://localhost:6379

# Upstash (example)
REDIS_URL=rediss://default:your-password@your-region.upstash.io:6379

# Redis Cloud (example)
REDIS_URL=redis://default:your-password@redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com:12345
```

### Connection URL Formats

| Provider | URL Format |
|----------|------------|
| Local | `redis://localhost:6379` |
| Local with password | `redis://:password@localhost:6379` |
| Upstash | `rediss://default:password@region.upstash.io:6379` |
| Redis Cloud | `redis://default:password@host:port` |
| Railway | `redis://default:password@host:port` |

**Note:** `rediss://` (with double 's') indicates TLS/SSL connection.

---

## Verifying Redis Connection

### Check via Application Logs

When Redis is properly configured, you'll see:
```
Redis connected successfully
Redis ready to accept commands
```

If Redis is unavailable:
```
Redis unavailable (ECONNREFUSED), using memory cache
```

### Check via Redis CLI

```bash
# Connect to local Redis
redis-cli

# Connect to remote Redis
redis-cli -h your-host -p your-port -a your-password

# Test connection
PING
# Should return: PONG

# Check PLHub cache keys
KEYS plhub:*
```

---

## Cache Configuration

PLHub uses different cache durations based on content type:

| Content Type | TTL | Prefix |
|-------------|-----|--------|
| Genres | 24 hours | `genres` |
| Certifications | 24 hours | `certs` |
| Trending | 1 hour | `trending` |
| Popular | 30 minutes | `popular` |
| Top Rated | 1 hour | `top_rated` |
| Media Lists | 15 minutes | `list` |
| Media Details | 10 minutes | `detail` |
| Search Results | 5 minutes | `search` |
| Watch Providers | 1 hour | `providers` |

---

## Clearing Cache

### Clear All PLHub Cache

```bash
redis-cli KEYS "plhub:*" | xargs redis-cli DEL
```

### Clear Specific Cache Types

```bash
# Clear trending cache
redis-cli KEYS "plhub:trending:*" | xargs redis-cli DEL

# Clear search cache
redis-cli KEYS "plhub:search:*" | xargs redis-cli DEL

# Clear media details cache
redis-cli KEYS "plhub:detail:*" | xargs redis-cli DEL
```

---

## Troubleshooting

### "ECONNREFUSED" Error

**Cause:** Redis server is not running or not accessible.

**Solutions:**
1. Start Redis: `redis-server` or `sudo service redis-server start`
2. Check if Redis is running: `redis-cli ping`
3. Check firewall rules
4. Verify the connection URL in `.env`

### "NOAUTH" or Authentication Error

**Cause:** Redis requires a password but none was provided.

**Solution:** Include password in the connection URL:
```env
REDIS_URL=redis://:your-password@localhost:6379
```

### High Memory Usage

**Cause:** Cache not being cleared, too many entries.

**Solutions:**
1. Reduce cache TTL values
2. Clear old cache: `redis-cli FLUSHDB`
3. Set Redis `maxmemory` policy:
   ```bash
   redis-cli CONFIG SET maxmemory 100mb
   redis-cli CONFIG SET maxmemory-policy allkeys-lru
   ```

### Connection Timeouts

**Cause:** Network issues or Redis server overloaded.

**Solutions:**
1. Check network connectivity
2. Increase timeout in cache middleware
3. Consider upgrading Redis tier

---

## Production Best Practices

1. **Use Redis Cloud Services** - Better reliability and automatic backups
2. **Enable TLS** - Use `rediss://` URLs for secure connections
3. **Set Memory Limits** - Prevent Redis from using all available memory
4. **Monitor Usage** - Use Redis monitoring tools (Upstash/Redis Cloud dashboards)
5. **Set Up Alerts** - Get notified when cache hit ratio drops

---

## Environment Variables Summary

```env
# Required for Redis (optional - falls back to memory cache)
REDIS_URL=redis://localhost:6379

# Example production configuration
REDIS_URL=rediss://default:your-password@your-region.upstash.io:6379
```

---

## Related Documentation

- [Cache Middleware](../src/middlewares/cache.middleware.js) - Implementation details
- [Redis Official Docs](https://redis.io/documentation)
- [Upstash Docs](https://docs.upstash.com/)
- [ioredis Library](https://github.com/redis/ioredis)

