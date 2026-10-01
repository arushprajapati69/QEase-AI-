import { Response } from 'express';
import { db } from '../lib/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { AdvanceQueueSchema, ToggleCounterSchema, TokenActionSchema } from '../schemas/validation';
import { broadcastQueueAdvanced, broadcastCounterChanged, broadcastTokenUpdated } from '../lib/socket';

export async function getLiveQueue(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId || '11111111-1111-4111-a111-111111111111';
    const tenant = db.getTenantById(tenantId);

    const counters = db.getCountersByTenant(tenantId);
    const waitingTokens = db.getWaitingTokensByTenant(tenantId);
    const servingTokens = db.getServingTokensByTenant(tenantId);
    const serviceTypes = db.getServiceTypesByTenant(tenantId);

    // Map token details with service names
    const enrichedWaiting = waitingTokens.map((t) => {
      const st = serviceTypes.find((s) => s.id === t.serviceTypeId);
      return {
        ...t,
        serviceName: st?.name || 'General Inquiry',
        avgDurationMin: st?.avgDurationMin || 5,
        requiredDocs: st?.requiredDocs || [],
      };
    });

    const enrichedServing = servingTokens.map((t) => {
      const st = serviceTypes.find((s) => s.id === t.serviceTypeId);
      const cnt = counters.find((c) => c.id === t.counterId);
      return {
        ...t,
        serviceName: st?.name || 'General Inquiry',
        counterNumber: cnt?.counterNumber || 'Counter 1',
      };
    });

    // Calculate live avg wait time
    const completed = db.getTokensByTenant(tenantId).filter((t) => t.status === 'COMPLETED');
    let totalWaitMs = 0;
    completed.forEach((t) => {
      if (t.createdAt && t.servedAt) {
        totalWaitMs += new Date(t.servedAt).getTime() - new Date(t.createdAt).getTime();
      }
    });
    const avgWaitMin = completed.length > 0 ? Math.round(totalWaitMs / (completed.length * 60000)) : 5;

    return res.json({
      success: true,
      tenant: {
        id: tenant?.id,
        slug: tenant?.slug,
        name: tenant?.name,
      },
      metrics: {
        activeCountersCount: counters.filter((c) => c.isActive).length,
        totalWaitingCount: waitingTokens.length,
        totalServingCount: servingTokens.length,
        avgWaitMinutes: avgWaitMin,
      },
      counters,
      serving: enrichedServing,
      waiting: enrichedWaiting,
      services: serviceTypes,
    });
  } catch (error) {
    console.error('[Admin Queue Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch live queue data.' });
  }
}

export async function advanceQueueNext(req: AuthenticatedRequest, res: Response) {
  try {
    const validated = AdvanceQueueSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, errors: validated.error.errors });
    }

    const tenantId = req.user?.tenantId || '11111111-1111-4111-a111-111111111111';
    const { counterId } = validated.data;

    const counter = db.getCounterById(counterId);
    if (!counter) {
      return res.status(404).json({ success: false, message: 'Counter not found.' });
    }

    // Advance queue in database state
    const { servingToken, updatedTokens } = db.advanceQueue(tenantId, counterId);

    const waitingTokens = db.getWaitingTokensByTenant(tenantId);
    const servingTokens = db.getServingTokensByTenant(tenantId);

    const payload = {
      counterId,
      counterNumber: counter.counterNumber,
      servingToken,
      waitingCount: waitingTokens.length,
      timestamp: new Date().toISOString(),
    };

    // Broadcast QUEUE_ADVANCED to all connected tellers, kiosks, and customer apps
    broadcastQueueAdvanced(tenantId, payload);

    // If a token is now serving, broadcast TOKEN_UPDATED to that customer's room
    if (servingToken) {
      broadcastTokenUpdated(servingToken.id, {
        status: 'SERVING',
        counterNumber: counter.counterNumber,
        positionInQueue: 0,
      });
    }

    // Broadcast updated positions to all remaining waiting token rooms
    waitingTokens.forEach((t) => {
      broadcastTokenUpdated(t.id, {
        positionInQueue: t.positionInQueue,
        status: t.status,
      });
    });

    return res.json({
      success: true,
      message: servingToken ? `Token ${servingToken.tokenNumber} assigned to ${counter.counterNumber}` : 'No more customers in waiting queue.',
      servingToken,
      remainingWaitingCount: waitingTokens.length,
    });
  } catch (error) {
    console.error('[Advance Queue Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to advance queue.' });
  }
}

export async function toggleCounterStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const validated = ToggleCounterSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, errors: validated.error.errors });
    }

    const tenantId = req.user?.tenantId || '11111111-1111-4111-a111-111111111111';
    const { counterId, isActive } = validated.data;

    const updatedCounter = db.toggleCounterStatus(counterId, isActive);
    if (!updatedCounter) {
      return res.status(404).json({ success: false, message: 'Counter not found.' });
    }

    // Broadcast event COUNTER_CHANGED
    broadcastCounterChanged(tenantId, {
      counterId: updatedCounter.id,
      counterNumber: updatedCounter.counterNumber,
      isActive: updatedCounter.isActive,
    });

    return res.json({
      success: true,
      counter: updatedCounter,
    });
  } catch (error) {
    console.error('[Toggle Counter Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update counter status.' });
  }
}

export async function handleTokenAction(req: AuthenticatedRequest, res: Response) {
  try {
    const validated = TokenActionSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, errors: validated.error.errors });
    }

    const { tokenId, action, counterId } = validated.data;
    const updatedToken = db.updateTokenStatus(tokenId, action as any, counterId);

    if (!updatedToken) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    broadcastTokenUpdated(tokenId, {
      status: updatedToken.status,
      positionInQueue: updatedToken.positionInQueue,
    });

    return res.json({
      success: true,
      token: updatedToken,
    });
  } catch (error) {
    console.error('[Token Action Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to process token action.' });
  }
}

export async function getAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId || '11111111-1111-4111-a111-111111111111';
    const metrics = db.getAnalyticsMetrics(tenantId);

    return res.json({
      success: true,
      analytics: metrics,
    });
  } catch (error) {
    console.error('[Analytics Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
}
