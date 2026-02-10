/**
 * Input validation utilities
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

export const validateUsername = (username: string): boolean => {
  // Username: 3-20 chars, alphanumeric + underscore
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters
  return password.length >= 8;
};

export const validateFullName = (name: string): boolean => {
  return name.trim().length >= 2 && name.length <= 100;
};

export const validateBlogTitle = (title: string): boolean => {
  return title.trim().length >= 3 && title.length <= 255;
};

export const validateBlogContent = (content: string): boolean => {
  // Remove HTML tags for length check
  const plainText = content.replace(/<[^>]*>/g, "").trim();
  return plainText.length >= 10;
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .substring(0, 1000); // Limit length
};

/**
 * Parse and validate JSON with error handling
 */
export const parseJSON = (json: string): any => {
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new Error("Invalid JSON format");
  }
};
