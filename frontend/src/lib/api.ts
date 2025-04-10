// Define custom error types
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function getJobStatus(jobId: string): Promise<any> {
  try {
    const response = await fetch(`http://localhost:3000/api/jobs/${jobId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new ApiError(errorData.detail || `HTTP error ${response.status}`, response.status);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle network errors
    throw new ApiError('Network error or server unreachable', 0);
  }
}