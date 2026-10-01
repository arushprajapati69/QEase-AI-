import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export const IssueTokenSchema = z.object({
  tenantSlug: z.string().min(1),
  serviceTypeId: z.string().min(1),
  customerName: z.string().optional(),
});

export const AdvanceQueueSchema = z.object({
  counterId: z.string().min(1),
  currentTokenId: z.string().min(1).optional(),
});

export const TokenActionSchema = z.object({
  tokenId: z.string().min(1),
  action: z.enum(['SERVE', 'COMPLETE', 'HOLD', 'NO_SHOW', 'CANCEL']),
  counterId: z.string().min(1).optional(),
});

export const ToggleCounterSchema = z.object({
  counterId: z.string().min(1),
  isActive: z.boolean(),
});

export const AskAiSchema = z.object({
  question: z.string().min(2).max(300),
  tokenId: z.string().min(1),
});

export const PredictionResponseSchema = z.object({
  estimatedWaitMinLower: z.number().int().min(0),
  estimatedWaitMinUpper: z.number().int().min(0),
  recommendedReturnTime: z.string(),
  canLeavePremises: z.boolean(),
  statusSummary: z.string(),
  confidenceScore: z.number().min(0).max(1),
});

export const AskAiResponseSchema = z.object({
  answer: z.string(),
  recommendedAction: z.enum(['STAY_NEARBY', 'CAN_LEAVE', 'RETURN_IMMEDIATELY']),
  suggestedReturnTimestamp: z.string(),
});
