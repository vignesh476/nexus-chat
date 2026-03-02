// Redis storage service for stories
const REDIS_PREFIX = 'stories:';
const CACHE_DURATION = 3600; // 1 hour in seconds

class StoriesCache {
  constructor() {
    this.isRedisAvailable = false;
    this.localCache = new Map();
    this.initRedis();
  }

  async initRedis() {
    try {
      // Check if Redis is available (this would be implemented on backend)
      const response = await fetch('/api/redis/health');
      this.isRedisAvailable = response.ok;
    } catch (error) {
      this.isRedisAvailable = false;
    }
  }

  // Generate cache key
  getCacheKey(type, identifier = 'all') {
    return `${REDIS_PREFIX}${type}:${identifier}`;
  }

  // Get stories from cache
  async getStories(username = null) {
    const key = this.getCacheKey('list', username || 'all');
    
    if (this.isRedisAvailable) {
      try {
        const response = await fetch(`/api/redis/get/${encodeURIComponent(key)}`);
        if (response.ok) {
          const data = await response.json();
          return data.value ? JSON.parse(data.value) : null;
        }
      } catch (error) {
        console.warn('Redis get failed, falling back to local cache');
      }
    }

    // Fallback to local cache
    return this.localCache.get(key) || null;
  }

  // Set stories in cache
  async setStories(stories, username = null) {
    const key = this.getCacheKey('list', username || 'all');
    const value = JSON.stringify(stories);

    if (this.isRedisAvailable) {
      try {
        await fetch('/api/redis/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            value,
            ttl: CACHE_DURATION
          })
        });
      } catch (error) {
        console.warn('Redis set failed, using local cache');
      }
    }

    // Always update local cache as fallback
    this.localCache.set(key, stories);
    
    // Clean up local cache after some time
    setTimeout(() => {
      this.localCache.delete(key);
    }, CACHE_DURATION * 1000);
  }

  // Invalidate cache for specific user or all
  async invalidateStories(username = null) {
    const key = this.getCacheKey('list', username || 'all');

    if (this.isRedisAvailable) {
      try {
        await fetch(`/api/redis/delete/${encodeURIComponent(key)}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.warn('Redis delete failed');
      }
    }

    this.localCache.delete(key);
  }

  // Cache story metadata (thumbnails, etc.)
  async cacheStoryMetadata(storyId, metadata) {
    const key = this.getCacheKey('metadata', storyId);
    const value = JSON.stringify(metadata);

    if (this.isRedisAvailable) {
      try {
        await fetch('/api/redis/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            value,
            ttl: CACHE_DURATION * 24 // 24 hours for metadata
          })
        });
      } catch (error) {
        console.warn('Redis metadata cache failed');
      }
    }

    this.localCache.set(key, metadata);
  }

  // Get cached story metadata
  async getStoryMetadata(storyId) {
    const key = this.getCacheKey('metadata', storyId);

    if (this.isRedisAvailable) {
      try {
        const response = await fetch(`/api/redis/get/${encodeURIComponent(key)}`);
        if (response.ok) {
          const data = await response.json();
          return data.value ? JSON.parse(data.value) : null;
        }
      } catch (error) {
        console.warn('Redis metadata get failed');
      }
    }

    return this.localCache.get(key) || null;
  }

  // Clear all story caches
  async clearAllCaches() {
    if (this.isRedisAvailable) {
      try {
        await fetch(`/api/redis/clear-pattern/${encodeURIComponent(REDIS_PREFIX + '*')}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.warn('Redis clear failed');
      }
    }

    this.localCache.clear();
  }
}

// Create singleton instance
const storiesCache = new StoriesCache();

export default storiesCache;