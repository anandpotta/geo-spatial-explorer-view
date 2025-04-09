
export const API_CONFIG = {
  // Using Cesium's default token access (will use basic rendering if token is invalid)
  // https://cesium.com/docs/cesiumjs-ref-doc/Ion.html
  CESIUM_ION_TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlM2YxZjJjYS0zYzYxLTQxZWQtYWJlZC0wYzQ2MjVmZjI5YmQiLCJpZCI6MTc5MjU1LCJpYXQiOjE3MDEzMzE3NDl9.UcqgxOJ1ROsFwRKmawP1xVRQYVa9Q0Ys5O-gWGQbFWk",
  
  // Always use fallback rendering since Ion token is invalid
  USE_ION_FALLBACK: true,
  
  // Local development doesn't require API keys
  USE_LOCAL: true,
  BASE_URL: "http://localhost:8080",
};
