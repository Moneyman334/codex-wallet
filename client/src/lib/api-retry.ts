export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const config = { ...defaultOptions, ...retryOptions };
  let lastError: Error | null = null;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If response is successful, return it
      if (response.ok) {
        return response;
      }

      // If it's not a retryable status, throw immediately
      if (!config.retryableStatuses.includes(response.status)) {
        return response;
      }

      // If we've exhausted retries, return the failed response
      if (attempt === config.maxRetries) {
        return response;
      }

      // Otherwise, retry after delay
      console.warn(`Request failed with status ${response.status}, retrying in ${delay}ms... (attempt ${attempt + 1}/${config.maxRetries})`);

    } catch (error) {
      lastError = error as Error;

      // If we've exhausted retries, throw the error
      if (attempt === config.maxRetries) {
        throw lastError;
      }

      console.warn(`Request failed: ${lastError.message}, retrying in ${delay}ms... (attempt ${attempt + 1}/${config.maxRetries})`);
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));

    // Increase delay with exponential backoff
    delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Request failed after all retries');
}

export async function apiRequestWithRetry(
  method: string,
  url: string,
  data?: any,
  retryOptions?: RetryOptions
): Promise<any> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetchWithRetry(url, options, retryOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}
