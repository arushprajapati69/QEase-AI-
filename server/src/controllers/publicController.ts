import { Request, Response } from 'express';
import { db } from '../lib/db';
import { generateQueuePrediction, askCustomerAssistant } from '../lib/gemini';
import { AskAiSchema } from '../schemas/validation';

export async function getPublicTokenStatus(req: Request, res: Response) {
  try {
    const { tenantSlug, tokenId } = req.params;

    const tenant = db.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return res.status(404).json({ success: false, message: `Tenant '${tenantSlug}' not found.` });
    }

    const token = db.getTokenByIdOrNumber(tenant.id, tokenId);
    if (!token) {
      return res.status(404).json({ success: false, message: `Token '${tokenId}' not found for tenant '${tenantSlug}'.` });
    }

    const serviceType = db.getServiceTypeById(token.serviceTypeId);
    const activeCounters = db.getCountersByTenant(tenant.id).filter((c) => c.isActive);
    const counter = token.counterId ? db.getCounterById(token.counterId) : null;

    // Calculate how many people are ahead of this customer
    const waitingTokens = db.getWaitingTokensByTenant(tenant.id);
    let peopleAhead = 0;

    if (token.status === 'WAITING') {
      peopleAhead = Math.max(0, token.positionInQueue - 1);
    } else if (token.status === 'SERVING') {
      peopleAhead = 0;
    } else {
      peopleAhead = 0;
    }

    // Run Gemini AI prediction for wait-time window
    const aiPrediction = await generateQueuePrediction({
      serviceName: serviceType?.name || 'General Inquiry',
      peopleAhead,
      activeCounters: Math.max(1, activeCounters.length),
      avgDurationMin: serviceType?.avgDurationMin || 5,
      recentRate: 4,
      currentDelayMin: 0,
    });

    return res.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          category: tenant.category,
        },
        token: {
          id: token.id,
          tokenNumber: token.tokenNumber,
          status: token.status,
          customerName: token.customerName,
          positionInQueue: token.positionInQueue,
          peopleAhead,
          assignedCounter: counter ? counter.counterNumber : null,
          createdAt: token.createdAt,
          servedAt: token.servedAt,
        },
        service: {
          id: serviceType?.id,
          name: serviceType?.name || 'General Service',
          avgDurationMin: serviceType?.avgDurationMin || 5,
          requiredDocs: serviceType?.requiredDocs || [],
          preliminaryWarning: serviceType?.preliminaryWarning,
        },
        activeCountersCount: activeCounters.length,
        prediction: aiPrediction,
      },
    });
  } catch (error) {
    console.error('[Public Token Status Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch customer token state.' });
  }
}

export async function askAiAssistant(req: Request, res: Response) {
  try {
    const validated = AskAiSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, errors: validated.error.errors });
    }

    const { question, tokenId } = validated.data;

    // Locate token across tenants
    let foundToken: any = null;
    let foundTenant: any = null;

    for (const tenant of db.getAllTenants()) {
      const tok = db.getTokenByIdOrNumber(tenant.id, tokenId);
      if (tok) {
        foundToken = tok;
        foundTenant = tenant;
        break;
      }
    }

    if (!foundToken || !foundTenant) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    const serviceType = db.getServiceTypeById(foundToken.serviceTypeId);
    const activeCounters = db.getCountersByTenant(foundTenant.id).filter((c) => c.isActive).length;
    const peopleAhead = Math.max(0, foundToken.positionInQueue - 1);

    // Initial prediction to pass wait time range to Gemini chat
    const prediction = await generateQueuePrediction({
      serviceName: serviceType?.name || 'Service',
      peopleAhead,
      activeCounters: Math.max(1, activeCounters),
      avgDurationMin: serviceType?.avgDurationMin || 5,
      recentRate: 4,
      currentDelayMin: 0,
    });

    const aiChatResponse = await askCustomerAssistant({
      tokenNumber: foundToken.tokenNumber,
      userQuestion: question,
      serviceName: serviceType?.name || 'General Inquiry',
      peopleAhead,
      waitMinLower: prediction.estimatedWaitMinLower,
      waitMinUpper: prediction.estimatedWaitMinUpper,
      activeCounters: Math.max(1, activeCounters),
      requiredDocs: serviceType?.requiredDocs || ['Government Photo ID'],
    });

    return res.json({
      success: true,
      data: aiChatResponse,
    });
  } catch (error) {
    console.error('[Ask AI Controller Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to process AI query.' });
  }
}
