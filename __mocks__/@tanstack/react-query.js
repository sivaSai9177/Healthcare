const mockQueryClient = {
  getQueryData: jest.fn(),
  setQueryData: jest.fn(),
  invalidateQueries: jest.fn(),
  refetchQueries: jest.fn(),
  cancelQueries: jest.fn(),
  removeQueries: jest.fn(),
  resetQueries: jest.fn(),
  clear: jest.fn(),
};

const mockUseQuery = jest.fn((key, fn, options) => ({
  data: undefined,
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
  status: 'success',
  refetch: jest.fn(),
}));

const mockUseMutation = jest.fn((fn, options) => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  data: undefined,
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  status: 'idle',
  reset: jest.fn(),
}));

module.exports = {
  QueryClient: jest.fn(() => mockQueryClient),
  QueryClientProvider: ({ children }) => children,
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useQueryClient: () => mockQueryClient,
  useInfiniteQuery: mockUseQuery,
  useQueries: jest.fn(() => []),
  useMutationState: jest.fn(() => []),
  useIsFetching: jest.fn(() => 0),
  useIsMutating: jest.fn(() => 0),
};