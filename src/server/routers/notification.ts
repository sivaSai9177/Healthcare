import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const notificationRouter = router({
  // Get unread notifications count
  getUnread: protectedProcedure
    .query(async ({ ctx: _ctx }) => {
      // Mock implementation - return empty notifications for now
      return {
        count: 0,
        notifications: [],
      };
    }),
  
  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.string(),
    }))
    .mutation(async ({ ctx: _ctx, input: _input }) => {
      // Mock implementation
      return { success: true };
    }),
  
  // Mark all as read
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx: _ctx }) => {
      // Mock implementation
      return { success: true };
    }),
});