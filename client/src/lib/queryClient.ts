import { QueryClient } from '@tanstack/react-query';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText;
    
    try {
      errorText = await res.text();
      console.error(`Response error (${res.status}):`, errorText);
      
      // Try to parse as JSON if it looks like JSON
      if (errorText.trim().startsWith('{')) {
        const errorDetails = JSON.parse(errorText);
        throw new Error(errorDetails.message || `API error: ${res.status}`);
      } else {
        // Not JSON response
        throw new Error(`API error: ${res.status}, non-JSON response received`);
      }
    } catch (e) {
      // Either text() failed or JSON.parse failed
      if (errorText) {
        throw new Error(`API error: ${res.status}, response: ${errorText.substring(0, 100)}...`);
      } else {
        throw new Error(`API error: ${res.status}`);
      }
    }
  }
}

export async function apiRequest<T = any>(
  options: {
    url: string;
    method?: string;
    body?: any;
    on401?: 'returnNull' | 'throw';
  } | string
): Promise<T | null> {
  // Handle string input (backward compatibility)
  if (typeof options === 'string') {
    options = { url: options, on401: 'throw' };
  }

  const { url, method = 'GET', body: data, on401 = 'throw' } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (data) {
    fetchOptions.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, fetchOptions);
    
    // For debugging purposes
    console.log(`API ${method} ${url} status:`, res.status);
    
    // Handle 401 Unauthorized specifically
    if (res.status === 401) {
      if (on401 === 'returnNull') {
        return null;
      } else {
        throw new Error('Unauthorized access');
      }
    }
    
    // Check if response is OK
    if (!res.ok) {
      // Try to get error details as text first to see what we're dealing with
      const errorText = await res.text();
      console.error(`API error response (${res.status}):`, errorText);
      
      // If it looks like JSON, parse it
      if (errorText.trim().startsWith('{')) {
        const errorDetails = JSON.parse(errorText);
        throw new Error(errorDetails.message || `API error: ${res.status}`);
      } else {
        // Not JSON, just throw the status
        throw new Error(`API error: ${res.status}, non-JSON response received`);
      }
    }
    
    // For HEAD requests or empty responses
    if (method === 'HEAD' || res.status === 204) {
      return null;
    }
    
    // Get the content type to make sure we're dealing with JSON
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    } else {
      const text = await res.text();
      console.error('Server returned non-JSON response:', text);
      throw new Error('Server returned non-JSON response');
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}) => {
  return async (context: any) => {
    const [url, ...params] = context.queryKey;
    
    // Handle query parameters
    const queryParams = params.length > 0 ? `?${new URLSearchParams(params[0]).toString()}` : '';
    const fullUrl = `${url}${queryParams}`;
    
    return apiRequest<T>({ url: fullUrl, on401: options.on401 });
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      queryFn: getQueryFn<any>({ on401: 'throw' }),
    },
  },
});