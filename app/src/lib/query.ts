import { QueryClient } from "@tanstack/react-query";

const fiveMinutes = 1000 * 60 * 5;
const thirtyMinutes = 1000 * 60 * 30;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: fiveMinutes,
      gcTime: thirtyMinutes,
    },
  },
});
