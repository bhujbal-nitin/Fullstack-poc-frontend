// 1. IMPORT must be the very first step.
import axios from 'axios'; 

// 2. The 'api' variable is declared and initialized immediately after the import.
const api = axios.create({
  // You can set a base URL here if needed
  // baseURL: 'YOUR_API_BASE_URL' 
});

// 3. The interceptor uses the declared 'api' instance.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for 401 Unauthorized status
    if (error.response && error.response.status === 401) {
      console.error('Session expired. Redirecting to login...');
      
      // Clear storage and redirect
      localStorage.removeItem('userToken'); 
      localStorage.removeItem('currentUser');
      window.location.href = `/usecase/login`;
    }

    // Re-throw the error for component catch blocks
    return Promise.reject(error);
  }
);

// 4. Export the single, configured instance.
export default api;