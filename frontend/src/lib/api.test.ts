import { getJobStatus, ApiError } from './api';
import fetchMock from 'jest-fetch-mock';

// Add Jest type imports
import '@jest/globals';

// Enable fetch mocks
fetchMock.enableMocks();

beforeEach(() => {
  fetchMock.resetMocks();
});

test('getJobStatus returns job data when successful', async () => {
  const mockJobData = { 
    job_id: '123', 
    status: 'completed', 
    progress: 100 
  };
  
  fetchMock.mockResponseOnce(JSON.stringify(mockJobData));
  
  const result = await getJobStatus('123');
  expect(result).toEqual(mockJobData);
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/jobs/123'));
});

test('getJobStatus throws ApiError when request fails', async () => {
  fetchMock.mockResponseOnce(JSON.stringify({ detail: 'Job not found' }), { status: 404 });
  
  await expect(getJobStatus('nonexistent')).rejects.toThrow(ApiError);
  await expect(getJobStatus('nonexistent')).rejects.toMatchObject({
    status: 404,
    message: 'Job not found'
  });
});

test('getJobStatus handles network errors', async () => {
  fetchMock.mockReject(new Error('Network error'));
  
  await expect(getJobStatus('123')).rejects.toThrow(ApiError);
  await expect(getJobStatus('123')).rejects.toMatchObject({
    status: 0,
    message: 'Network error or server unreachable'
  });
});

test('getJobStatus handles malformed JSON response', async () => {
  fetchMock.mockResponseOnce('Not valid JSON', { status: 200 });
  
  await expect(getJobStatus('123')).rejects.toThrow();
});