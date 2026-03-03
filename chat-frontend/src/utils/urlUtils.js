// Utility function to rewrite old local URLs to production URLs
// This handles URLs stored in MongoDB from local development

const getProductionUrl = (url) => {
  if (!url) return url;
  
  // Only process http/https URLs
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }
  
  // Get the production API URL from environment
  const productionUrl = process.env.REACT_APP_API_URL || 'https://chat-backend-production-60e9.up.railway.app';
  
  // Check if this is a local development URL that needs rewriting
  const isLocalUrl = url.includes('127.0.0.1:8000') || 
                     url.includes('localhost:8000') ||
                     url.includes('localhost:5000');
  
  if (isLocalUrl) {
    // Extract the path after the local URL
    const pathMatch = url.match(/(:\d+\/.*)$/);
    if (pathMatch) {
      const path = pathMatch[1];
      // Remove leading slash from path if present
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      return `${productionUrl.replace(/\/$/, '')}/${cleanPath}`;
    }
  }
  
  return url;
};

/**
 * Rewrite URLs in objects that may contain profile pictures or media
 * @param {Object|Array|string} data - The data to process
 * @param {string[]} fields - Field names that may contain URLs
 * @returns {Object|Array|string} - Data with URLs rewritten
 */
const rewriteUrls = (data, fields = ['profile_picture', 'file_path', 'image_url', 'avatar']) => {
  if (!data) return data;
  
  if (typeof data === 'string') {
    return getProductionUrl(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => rewriteUrls(item, fields));
  }
  
  if (typeof data === 'object') {
    const result = {};
    for (const key in data) {
      if (fields.includes(key) && typeof data[key] === 'string') {
        result[key] = getProductionUrl(data[key]);
      } else if (typeof data[key] === 'object') {
        result[key] = rewriteUrls(data[key], fields);
      } else {
        result[key] = data[key];
      }
    }
    return result;
  }
  
  return data;
};

export { getProductionUrl, rewriteUrls };
export default { getProductionUrl, rewriteUrls };
