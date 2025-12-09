// Generate Gravatar URL from email
export function getGravatarUrl(email: string | undefined, size: number = 80): string {
  if (!email) {
    return `https://www.gravatar.com/avatar/?d=mp&s=${size}`;
  }
  
  // Simple hash function for email (MD5-like behavior for Gravatar)
  const hash = simpleHash(email.toLowerCase().trim());
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=${size}`;
}

// Simple hash function to generate consistent hash from email
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Convert to hex string and pad to look like MD5
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return hexHash.repeat(4).substring(0, 32);
}
