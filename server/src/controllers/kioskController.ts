import { Request, Response } from 'express';
import { db } from '../lib/db';
import { IssueTokenSchema } from '../schemas/validation';
import { broadcastTokenCreated, broadcastQueueAdvanced } from '../lib/socket';
import { generateQueuePrediction } from '../lib/gemini';

export async function getKioskData(req: Request, res: Response) {
  try {
    const { tenantSlug } = req.params;
    const tenant = db.getTenantBySlug(tenantSlug);

    if (!tenant) {
      return res.status(404).json({ success: false, message: `Tenant with slug '${tenantSlug}' not found.` });
    }

    const serviceTypes = db.getServiceTypesByTenant(tenant.id);
    const activeCounters = db.getCountersByTenant(tenant.id).filter((c) => c.isActive);
    const waitingCount = db.getWaitingTokensByTenant(tenant.id).length;

    return res.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        category: tenant.category,
      },
      services: serviceTypes,
      stats: {
        activeCounters: activeCounters.length,
        totalWaiting: waitingCount,
      },
    });
  } catch (error) {
    console.error('[Kiosk Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch kiosk details.' });
  }
}

export async function issueToken(req: Request, res: Response) {
  try {
    const validated = IssueTokenSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, errors: validated.error.errors });
    }

    const { tenantSlug, serviceTypeId, customerName } = validated.data;
    const tenant = db.getTenantBySlug(tenantSlug);

    if (!tenant) {
      return res.status(404).json({ success: false, message: `Tenant '${tenantSlug}' not found.` });
    }

    const serviceType = db.getServiceTypeById(serviceTypeId);
    if (!serviceType) {
      return res.status(400).json({ success: false, message: 'Invalid service type selected.' });
    }

    // Create token in database/memory
    const newToken = db.createToken(tenant.id, serviceTypeId, customerName);

    // Calculate initial prediction via AI engine
    const activeCounters = db.getCountersByTenant(tenant.id).filter((c) => c.isActive).length;
    const waitingList = db.getWaitingTokensByTenant(tenant.id);
    const peopleAhead = Math.max(0, newToken.positionInQueue - 1);

    const aiPrediction = await generateQueuePrediction({
      serviceName: serviceType.name,
      peopleAhead,
      activeCounters: Math.max(1, activeCounters),
      avgDurationMin: serviceType.avgDurationMin,
      recentRate: 4,
      currentDelayMin: 0,
    });

    const responseData = {
      token: {
        id: newToken.id,
        tokenNumber: newToken.tokenNumber,
        positionInQueue: newToken.positionInQueue,
        status: newToken.status,
        customerName: newToken.customerName,
        createdAt: newToken.createdAt,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
      },
      service: {
        id: serviceType.id,
        name: serviceType.name,
        requiredDocs: serviceType.requiredDocs,
      },
      prediction: aiPrediction,
      qrUrl: `${req.protocol}://${req.get('host')}/queue/${tenant.slug}/${newToken.tokenNumber.toLowerCase()}`,
    };

    // Broadcast Socket.io event TOKEN_CREATED
    broadcastTokenCreated(tenant.id, {
      token: newToken,
      totalWaiting: waitingList.length,
    });

    return res.status(201).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('[Issue Token Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to issue token.' });
  }
}
