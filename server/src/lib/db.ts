import { Pool } from 'pg';
import crypto from 'crypto';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  category: string;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'TELLER' | 'KIOSK';
  name: string;
  createdAt: string;
}

export interface ServiceType {
  id: string;
  tenantId: string;
  name: string;
  avgDurationMin: number;
  requiredDocs: string[];
  preliminaryWarning?: string;
  createdAt: string;
}

export interface Counter {
  id: string;
  tenantId: string;
  counterNumber: string;
  assignedUserId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Token {
  id: string;
  tenantId: string;
  serviceTypeId: string;
  tokenNumber: string;
  status: 'WAITING' | 'SERVING' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED' | 'HOLD';
  counterId: string | null;
  customerName?: string;
  positionInQueue: number;
  createdAt: string;
  servedAt?: string | null;
  completedAt?: string | null;
}

export interface AiPredictionLog {
  id: string;
  tokenId: string;
  predictedWaitMinLower: number;
  predictedWaitMinUpper: number;
  predictedTurnStart: string;
  predictedTurnEnd: string;
  confidenceScore: number;
  calculatedAt: string;
}

// Global In-Memory Store for fallback zero-dependency operation
const memoryDb = {
  tenants: [] as Tenant[],
  users: [] as User[],
  serviceTypes: [] as ServiceType[],
  counters: [] as Counter[],
  tokens: [] as Token[],
  aiPredictions: [] as AiPredictionLog[],
};

// Initialize PostgreSQL Pool if DATABASE_URL is available
const databaseUrl = process.env.DATABASE_URL;
export const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

// Seed standard initial data
export function seedInitialData() {
  // 1. Tenants
  const tenantAbc: Tenant = {
    id: '11111111-1111-4111-a111-111111111111',
    slug: 'abc-bank',
    name: 'ABC National Bank - Downtown Branch',
    category: 'Financial Institutions',
    createdAt: new Date().toISOString(),
  };

  const tenantHealth: Tenant = {
    id: '22222222-2222-4222-a222-222222222222',
    slug: 'city-health',
    name: 'City Urgent Care & Outpatient Clinic',
    category: 'Healthcare Facilities',
    createdAt: new Date().toISOString(),
  };

  const tenantTelecom: Tenant = {
    id: '33333333-3333-4333-a333-333333333333',
    slug: 'telecom-hub',
    name: 'Global Telecom Flagship Experience Center',
    category: 'Telecom & Retail',
    createdAt: new Date().toISOString(),
  };

  memoryDb.tenants = [tenantAbc, tenantHealth, tenantTelecom];

  // 2. Users (ABC Bank Staff)
  const userAdmin: User = {
    id: 'u1111111-1111-4111-a111-111111111111',
    tenantId: tenantAbc.id,
    email: 'admin@abcbank.com',
    passwordHash: 'password123', // In prod, hashed bcrypt
    role: 'ADMIN',
    name: 'Sarah Connor (Branch Manager)',
    createdAt: new Date().toISOString(),
  };

  const userTeller1: User = {
    id: 'u2222222-2222-4222-a222-222222222222',
    tenantId: tenantAbc.id,
    email: 'teller1@abcbank.com',
    passwordHash: 'password123',
    role: 'TELLER',
    name: 'David Miller (Counter 1)',
    createdAt: new Date().toISOString(),
  };

  const userTeller2: User = {
    id: 'u3333333-3333-4333-a333-333333333333',
    tenantId: tenantAbc.id,
    email: 'teller2@abcbank.com',
    passwordHash: 'password123',
    role: 'TELLER',
    name: 'Elena Rostova (Counter 2)',
    createdAt: new Date().toISOString(),
  };

  memoryDb.users = [userAdmin, userTeller1, userTeller2];

  // 3. Service Types
  const kycService: ServiceType = {
    id: 's1111111-1111-4111-a111-111111111111',
    tenantId: tenantAbc.id,
    name: 'KYC Update / Verification',
    avgDurationMin: 6,
    requiredDocs: ['Aadhaar Card', 'PAN Card', 'Address Proof'],
    preliminaryWarning: 'Ensure physical copies of documents are available before reaching the counter.',
    createdAt: new Date().toISOString(),
  };

  const cashService: ServiceType = {
    id: 's2222222-2222-4222-a222-222222222222',
    tenantId: tenantAbc.id,
    name: 'Cash / Cheque Deposit',
    avgDurationMin: 4,
    requiredDocs: ['Deposit Slip', 'Account Number', 'Govt Photo ID'],
    preliminaryWarning: 'Pre-fill your deposit slip while waiting in the virtual queue.',
    createdAt: new Date().toISOString(),
  };

  const loanService: ServiceType = {
    id: 's3333333-3333-4333-a333-333333333333',
    tenantId: tenantAbc.id,
    name: 'Loan & Mortgage Consultation',
    avgDurationMin: 12,
    requiredDocs: ['Income Statement', 'Tax Returns', 'Bank Passbook'],
    preliminaryWarning: 'Have your last 6 months bank statements ready.',
    createdAt: new Date().toISOString(),
  };

  memoryDb.serviceTypes = [kycService, cashService, loanService];

  // 4. Counters
  const counter1: Counter = {
    id: 'c1111111-1111-4111-a111-111111111111',
    tenantId: tenantAbc.id,
    counterNumber: 'Counter 1',
    assignedUserId: userTeller1.id,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const counter2: Counter = {
    id: 'c2222222-2222-4222-a222-222222222222',
    tenantId: tenantAbc.id,
    counterNumber: 'Counter 2',
    assignedUserId: userTeller2.id,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const counter3: Counter = {
    id: 'c3333333-3333-4333-a333-333333333333',
    tenantId: tenantAbc.id,
    counterNumber: 'Counter 3',
    assignedUserId: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const counter4: Counter = {
    id: 'c4444444-4444-4444-a444-444444444444',
    tenantId: tenantAbc.id,
    counterNumber: 'Counter 4',
    assignedUserId: null,
    isActive: false,
    createdAt: new Date().toISOString(),
  };

  memoryDb.counters = [counter1, counter2, counter3, counter4];

  // 5. Initial Queue Tokens for ABC Bank
  const initialTokens: Token[] = [
    {
      id: 't4111111-1111-4111-a111-111111111111',
      tenantId: tenantAbc.id,
      serviceTypeId: kycService.id,
      tokenNumber: 'TOKEN-41',
      status: 'COMPLETED',
      counterId: counter1.id,
      customerName: 'Robert Lang',
      positionInQueue: 0,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      servedAt: new Date(Date.now() - 3000000).toISOString(),
      completedAt: new Date(Date.now() - 2500000).toISOString(),
    },
    {
      id: 't4222222-2222-4222-a222-222222222222',
      tenantId: tenantAbc.id,
      serviceTypeId: cashService.id,
      tokenNumber: 'TOKEN-42',
      status: 'COMPLETED',
      counterId: counter2.id,
      customerName: 'Maria Garcia',
      positionInQueue: 0,
      createdAt: new Date(Date.now() - 3000000).toISOString(),
      servedAt: new Date(Date.now() - 2400000).toISOString(),
      completedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 't4333333-3333-4333-a333-333333333333',
      tenantId: tenantAbc.id,
      serviceTypeId: kycService.id,
      tokenNumber: 'TOKEN-43',
      status: 'SERVING',
      counterId: counter1.id,
      customerName: 'James Wilson',
      positionInQueue: 0,
      createdAt: new Date(Date.now() - 2000000).toISOString(),
      servedAt: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: 't4444444-4444-4444-a444-444444444444',
      tenantId: tenantAbc.id,
      serviceTypeId: cashService.id,
      tokenNumber: 'TOKEN-44',
      status: 'SERVING',
      counterId: counter2.id,
      customerName: 'Chloe Bennett',
      positionInQueue: 0,
      createdAt: new Date(Date.now() - 1500000).toISOString(),
      servedAt: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: 't4555555-5555-4555-a555-555555555555',
      tenantId: tenantAbc.id,
      serviceTypeId: kycService.id,
      tokenNumber: 'TOKEN-45',
      status: 'WAITING',
      counterId: null,
      customerName: 'Alex Chen',
      positionInQueue: 1,
      createdAt: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      id: 't4666666-6666-4666-a666-666666666666',
      tenantId: tenantAbc.id,
      serviceTypeId: loanService.id,
      tokenNumber: 'TOKEN-46',
      status: 'WAITING',
      counterId: null,
      customerName: 'Priya Sharma',
      positionInQueue: 2,
      createdAt: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: 't4777777-7777-4777-a777-777777777777',
      tenantId: tenantAbc.id,
      serviceTypeId: kycService.id,
      tokenNumber: 'TOKEN-47',
      status: 'WAITING',
      counterId: null,
      customerName: 'Michael Scott',
      positionInQueue: 3,
      createdAt: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: 't4888888-8888-4888-a888-888888888888',
      tenantId: tenantAbc.id,
      serviceTypeId: cashService.id,
      tokenNumber: 'TOKEN-48',
      status: 'WAITING',
      counterId: null,
      customerName: 'Samantha Reed',
      positionInQueue: 4,
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: 't4999999-9999-4999-a999-999999999999',
      tenantId: tenantAbc.id,
      serviceTypeId: kycService.id,
      tokenNumber: 'TOKEN-49',
      status: 'WAITING',
      counterId: null,
      customerName: 'David Zhang',
      positionInQueue: 5,
      createdAt: new Date().toISOString(),
    },
  ];

  memoryDb.tokens = initialTokens;
  console.log('[Database] Seeded initial memory store with 3 tenants, service types, tellers, counters & queue tokens.');
}

// Call seeding immediately
seedInitialData();

export const db = {
  // Tenant operations
  getTenantBySlug(slug: string): Tenant | undefined {
    return memoryDb.tenants.find((t) => t.slug === slug);
  },
  getTenantById(id: string): Tenant | undefined {
    return memoryDb.tenants.find((t) => t.id === id);
  },
  getAllTenants(): Tenant[] {
    return memoryDb.tenants;
  },

  // User operations
  getUserByEmail(email: string): User | undefined {
    return memoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  getUserById(id: string): User | undefined {
    return memoryDb.users.find((u) => u.id === id);
  },

  // Service Types operations
  getServiceTypesByTenant(tenantId: string): ServiceType[] {
    return memoryDb.serviceTypes.filter((s) => s.tenantId === tenantId);
  },
  getServiceTypeById(id: string): ServiceType | undefined {
    return memoryDb.serviceTypes.find((s) => s.id === id);
  },

  // Counters operations
  getCountersByTenant(tenantId: string): Counter[] {
    return memoryDb.counters.filter((c) => c.tenantId === tenantId);
  },
  getCounterById(id: string): Counter | undefined {
    return memoryDb.counters.find((c) => c.id === id);
  },
  toggleCounterStatus(counterId: string, isActive: boolean): Counter | undefined {
    const counter = memoryDb.counters.find((c) => c.id === counterId);
    if (counter) {
      counter.isActive = isActive;
    }
    return counter;
  },

  // Tokens operations
  getTokensByTenant(tenantId: string): Token[] {
    return memoryDb.tokens.filter((t) => t.tenantId === tenantId);
  },
  getWaitingTokensByTenant(tenantId: string): Token[] {
    return memoryDb.tokens
      .filter((t) => t.tenantId === tenantId && (t.status === 'WAITING' || t.status === 'HOLD'))
      .sort((a, b) => a.positionInQueue - b.positionInQueue);
  },
  getServingTokensByTenant(tenantId: string): Token[] {
    return memoryDb.tokens.filter((t) => t.tenantId === tenantId && t.status === 'SERVING');
  },
  getTokenByIdOrNumber(tenantId: string, query: string): Token | undefined {
    const qClean = query.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return memoryDb.tokens.find(
      (t) =>
        t.tenantId === tenantId &&
        (t.id === query ||
          t.tokenNumber.toLowerCase() === query.toLowerCase() ||
          t.tokenNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === qClean ||
          qClean.endsWith(t.tokenNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()))
    );
  },
  createToken(tenantId: string, serviceTypeId: string, customerName?: string): Token {
    const waitingTokens = this.getWaitingTokensByTenant(tenantId);
    const maxPosition = waitingTokens.length > 0 ? Math.max(...waitingTokens.map((t) => t.positionInQueue)) : 0;
    
    // Generate next token number e.g. TOKEN-50
    const tenantTokens = memoryDb.tokens.filter((t) => t.tenantId === tenantId);
    const nextNum = tenantTokens.length + 41;

    const newToken: Token = {
      id: crypto.randomUUID(),
      tenantId,
      serviceTypeId,
      tokenNumber: `TOKEN-${nextNum}`,
      status: 'WAITING',
      counterId: null,
      customerName: customerName || `Walk-in Guest ${nextNum}`,
      positionInQueue: maxPosition + 1,
      createdAt: new Date().toISOString(),
    };

    memoryDb.tokens.push(newToken);
    return newToken;
  },

  advanceQueue(tenantId: string, counterId: string): { servingToken: Token | null; updatedTokens: Token[] } {
    // 1. Mark existing serving token at counterId as COMPLETED
    const currentServing = memoryDb.tokens.find((t) => t.tenantId === tenantId && t.counterId === counterId && t.status === 'SERVING');
    if (currentServing) {
      currentServing.status = 'COMPLETED';
      currentServing.completedAt = new Date().toISOString();
    }

    // 2. Pick next waiting token
    const waitingTokens = memoryDb.tokens
      .filter((t) => t.tenantId === tenantId && t.status === 'WAITING')
      .sort((a, b) => a.positionInQueue - b.positionInQueue);

    let nextToken: Token | null = null;

    if (waitingTokens.length > 0) {
      nextToken = waitingTokens[0];
      nextToken.status = 'SERVING';
      nextToken.counterId = counterId;
      nextToken.positionInQueue = 0;
      nextToken.servedAt = new Date().toISOString();

      // Recalculate remaining waiting token positions
      const remainingWaiting = memoryDb.tokens
        .filter((t) => t.tenantId === tenantId && t.status === 'WAITING')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      remainingWaiting.forEach((t, idx) => {
        t.positionInQueue = idx + 1;
      });
    }

    return {
      servingToken: nextToken,
      updatedTokens: memoryDb.tokens.filter((t) => t.tenantId === tenantId),
    };
  },

  updateTokenStatus(tokenId: string, status: Token['status'], counterId?: string): Token | undefined {
    const token = memoryDb.tokens.find((t) => t.id === tokenId);
    if (!token) return undefined;

    token.status = status;
    if (counterId) token.counterId = counterId;

    if (status === 'SERVING') {
      token.servedAt = new Date().toISOString();
      token.positionInQueue = 0;
    } else if (status === 'COMPLETED' || status === 'NO_SHOW' || status === 'CANCELLED') {
      token.completedAt = new Date().toISOString();
    }

    // Re-index waiting positions for tenant
    const waitingTokens = memoryDb.tokens
      .filter((t) => t.tenantId === token.tenantId && t.status === 'WAITING')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    waitingTokens.forEach((t, idx) => {
      t.positionInQueue = idx + 1;
    });

    return token;
  },

  getAnalyticsMetrics(tenantId: string) {
    const tenantTokens = memoryDb.tokens.filter((t) => t.tenantId === tenantId);
    const completedTokens = tenantTokens.filter((t) => t.status === 'COMPLETED');
    const totalServed = completedTokens.length;

    let totalWaitMs = 0;
    completedTokens.forEach((t) => {
      if (t.createdAt && t.servedAt) {
        totalWaitMs += new Date(t.servedAt).getTime() - new Date(t.createdAt).getTime();
      }
    });

    const avgWaitMin = totalServed > 0 ? Math.round(totalWaitMs / (totalServed * 60000)) : 5;
    const activeCounters = memoryDb.counters.filter((c) => c.tenantId === tenantId && c.isActive).length;
    const currentWaiting = tenantTokens.filter((t) => t.status === 'WAITING').length;

    return {
      totalServed,
      currentWaiting,
      activeCounters,
      avgWaitMin,
      aiAccuracyRate: 94.8,
      hourlyThroughput: [
        { hour: '9:00 AM', count: 14 },
        { hour: '10:00 AM', count: 22 },
        { hour: '11:00 AM', count: 31 },
        { hour: '12:00 PM', count: 18 },
        { hour: '1:00 PM', count: 26 },
      ],
    };
  },
};
