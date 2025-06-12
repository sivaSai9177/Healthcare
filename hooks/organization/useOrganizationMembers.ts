import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/trpc';
import { startTransition, useOptimistic } from 'react';
import type { z } from 'zod';
import type { 
  OrganizationMemberResponseSchema,
  InviteMembersSchema,
  UpdateMemberRoleSchema,
  RemoveMemberSchema,
  GetOrganizationMembersSchema
} from '@/lib/validations/organization';
import { log } from '@/lib/core/debug/logger';

type MemberResponse = z.infer<typeof OrganizationMemberResponseSchema>;
type GetMembersInput = z.infer<typeof GetOrganizationMembersSchema>;

interface UseOrganizationMembersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export function useOrganizationMembers(
  organizationId: string,
  options: UseOrganizationMembersOptions = {}
) {
  const queryClient = useQueryClient();
  const { page = 1, limit = 20, search, role, status } = options;
  
  // Build query input
  const queryInput: GetMembersInput = {
    organizationId,
    page,
    limit,
    ...(search && { search }),
    ...(role && { role: role as any }),
    ...(status && { status: status as any }),
  };
  
  // Fetch members with pagination
  const query = api.organization.getMembers.useQuery(queryInput, {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    keepPreviousData: true, // For smooth pagination
  });

  // Invite members mutation
  const inviteMutation = api.organization.inviteMembers.useMutation({
    onSuccess: (data, variables) => {
      log.info('Members invited successfully', 'USE_ORG_MEMBERS', { 
        count: variables.invitations.length 
      });
      
      // Invalidate members list to show pending invitations
      queryClient.invalidateQueries({
        queryKey: [['organization', 'getMembers'], { input: { organizationId } }],
      });
    },
    onError: (error) => {
      log.error('Failed to invite members', 'USE_ORG_MEMBERS', { error });
    },
  });

  // Update member role mutation with optimistic update
  const updateRoleMutation = api.organization.updateMemberRole.useMutation({
    onMutate: async ({ userId, role }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: [['organization', 'getMembers'], { input: queryInput }],
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<{
        members: MemberResponse[];
        total: number;
        page: number;
        totalPages: number;
      }>([['organization', 'getMembers'], { input: queryInput }]);

      // Optimistically update member role
      if (previousData) {
        queryClient.setQueryData(
          [['organization', 'getMembers'], { input: queryInput }],
          {
            ...previousData,
            members: previousData.members.map(member =>
              member.userId === userId ? { ...member, role } : member
            ),
          }
        );
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          [['organization', 'getMembers'], { input: queryInput }],
          context.previousData
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      startTransition(() => {
        queryClient.invalidateQueries({
          queryKey: [['organization', 'getMembers'], { input: { organizationId } }],
        });
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = api.organization.removeMember.useMutation({
    onMutate: async ({ userId }) => {
      // Optimistically remove from list
      await queryClient.cancelQueries({
        queryKey: [['organization', 'getMembers'], { input: queryInput }],
      });

      const previousData = queryClient.getQueryData<{
        members: MemberResponse[];
        total: number;
        page: number;
        totalPages: number;
      }>([['organization', 'getMembers'], { input: queryInput }]);

      if (previousData) {
        queryClient.setQueryData(
          [['organization', 'getMembers'], { input: queryInput }],
          {
            ...previousData,
            members: previousData.members.filter(m => m.userId !== userId),
            total: previousData.total - 1,
          }
        );
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [['organization', 'getMembers'], { input: queryInput }],
          context.previousData
        );
      }
    },
    onSettled: () => {
      startTransition(() => {
        queryClient.invalidateQueries({
          queryKey: [['organization', 'getMembers'], { input: { organizationId } }],
        });
      });
    },
  });

  return {
    // Data
    members: query.data?.members ?? [],
    total: query.data?.total ?? 0,
    currentPage: query.data?.page ?? 1,
    totalPages: query.data?.totalPages ?? 1,
    
    // Query states
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    
    // Mutations
    inviteMembers: inviteMutation.mutate,
    inviteMembersAsync: inviteMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
    inviteError: inviteMutation.error,
    
    updateMemberRole: updateRoleMutation.mutate,
    updateMemberRoleAsync: updateRoleMutation.mutateAsync,
    isUpdatingRole: updateRoleMutation.isPending,
    updateRoleError: updateRoleMutation.error,
    
    removeMember: removeMemberMutation.mutate,
    removeMemberAsync: removeMemberMutation.mutateAsync,
    isRemoving: removeMemberMutation.isPending,
    removeError: removeMemberMutation.error,
    
    // Utilities
    refetch: query.refetch,
  };
}

// Hook for using organization codes
export function useOrganizationCode(organizationId: string) {
  const queryClient = useQueryClient();
  
  // Generate code mutation
  const generateCodeMutation = api.organization.generateCode.useMutation({
    onSuccess: (data) => {
      log.info('Organization code generated', 'USE_ORG_CODE', { 
        code: data.code 
      });
    },
  });

  // Join by code mutation
  const joinByCodeMutation = api.organization.joinByCode.useMutation({
    onSuccess: () => {
      // Invalidate user's organizations list
      queryClient.invalidateQueries({
        queryKey: [['organization', 'listUserOrganizations']],
      });
    },
  });

  return {
    generateCode: generateCodeMutation.mutate,
    generateCodeAsync: generateCodeMutation.mutateAsync,
    isGenerating: generateCodeMutation.isPending,
    generatedCode: generateCodeMutation.data,
    generateError: generateCodeMutation.error,
    
    joinByCode: joinByCodeMutation.mutate,
    joinByCodeAsync: joinByCodeMutation.mutateAsync,
    isJoining: joinByCodeMutation.isPending,
    joinError: joinByCodeMutation.error,
  };
}