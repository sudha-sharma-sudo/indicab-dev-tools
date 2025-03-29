// Mock API client for testing
interface ApiResponse<T> {
  data: T;
}

const mockAxios = {
  get: <T>(url: string): Promise<ApiResponse<T>> => {
    return Promise.resolve({ data: {} as T });
  }
};

const API_URL = 'https://api.example.com';

export const getUsers = async () => {
  return mockAxios.get(`${API_URL}/users`);
};
