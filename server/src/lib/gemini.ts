import { GoogleGenAI } from '@google/genai';
import { PredictionResponseSchema, AskAiResponseSchema } from '../schemas/validation';

export const GEMINI_MODEL = 'gemini-2.5-flash';

// Check API key presence
const apiKey = process.env.GEMINI_API_KEY;

export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// System Prompt as specified in Section 14
const WAITWISE_SYSTEM_PROMPT = `You are WaitWise AI, an expert operational queue intelligence engine and polite customer journey assistant.

Your role is twofold:
1. Predict accurate customer waiting times based on real-time service metrics, active counters, queue velocity, and operational delays.
2. Answer customer queries with strict contextual precision regarding their queue position, estimated turn time, document preparation requirements, and mobility choices (e.g., whether they can leave for coffee/lunch).

Behavioral Rules:
- Be clear, practical, and empathetic.
- Base advice strictly on the provided real-time operational context (queue position, active counters, average service velocity).
- Always advise customers to return when 3 or fewer people are ahead of them.
- NEVER fabricate queue metrics or confirm sensitive personal identifier numbers (e.g., Aadhaar, PAN, SSN numbers). Only list required document *types*.
- Deliver structured data outputs in valid JSON when requested.`;

export interface PredictionInput {
  serviceName: string;
  peopleAhead: number;
  activeCounters: number;
  avgDurationMin: number;
  recentRate: number;
  currentDelayMin: number;
}

export interface ChatInput {
  tokenNumber: string;
  userQuestion: string;
  serviceName: string;
  peopleAhead: number;
  waitMinLower: number;
  waitMinUpper: number;
  activeCounters: number;
  requiredDocs: string[];
}

/**
 * Predict Wait Time using Gemini 2.5 Flash SDK (Prompt A)
 */
export async function generateQueuePrediction(input: PredictionInput) {
  const { serviceName, peopleAhead, activeCounters, avgDurationMin, recentRate, currentDelayMin } = input;

  // Fallback calculation helper
  const activeCount = Math.max(1, activeCounters);
  const baseMinutesPerCustomer = avgDurationMin;
  const estimatedMin = Math.round((peopleAhead * baseMinutesPerCustomer) / activeCount + currentDelayMin);
  const lowerMin = Math.max(0, estimatedMin - 3);
  const upperMin = estimatedMin + 7;

  const now = new Date();
  const returnTimeObj = new Date(now.getTime() + estimatedMin * 60 * 1000);
  const formattedReturnTime = returnTimeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const fallbackResult = {
    estimatedWaitMinLower: lowerMin,
    estimatedWaitMinUpper: upperMin,
    recommendedReturnTime: formattedReturnTime,
    canLeavePremises: peopleAhead > 3 && estimatedMin >= 15,
    statusSummary: peopleAhead === 0 
      ? "You are next! Please proceed to the assigned counter."
      : peopleAhead <= 3
      ? "Your turn is approaching fast. Please stay in or return to the waiting area."
      : `Queue is moving steadily. Estimated turn around ${formattedReturnTime}.`,
    confidenceScore: 0.92,
  };

  if (!ai) {
    console.log('[Gemini SDK] GEMINI_API_KEY missing. Using statistical heuristic prediction.');
    return fallbackResult;
  }

  const predictionPrompt = `${WAITWISE_SYSTEM_PROMPT}

Analyze the current live queue state and calculate the predicted wait time window:

OPERATIONAL DATA:
- Service Type: ${serviceName}
- Current Queue Position (Ahead): ${peopleAhead}
- Total Active Counters: ${activeCounters}
- Historical Avg Service Duration: ${avgDurationMin} minutes
- Recent Velocity (Last 10 min completion rate): ${recentRate} customers/10min
- Active Delays Reported: ${currentDelayMin} minutes

Generate a precise estimation window and return ONLY a JSON object matching this schema:
{
  "estimatedWaitMinLower": number,
  "estimatedWaitMinUpper": number,
  "recommendedReturnTime": "HH:MM AM/PM",
  "canLeavePremises": boolean,
  "statusSummary": "string",
  "confidenceScore": number
}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: predictionPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      const validated = PredictionResponseSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
    }
    return fallbackResult;
  } catch (error) {
    console.error('[Gemini SDK Error] Prediction failed:', error);
    return fallbackResult;
  }
}

/**
 * Customer "Ask AI" Chatbot Assistant (Prompt B)
 */
export async function askCustomerAssistant(input: ChatInput) {
  const {
    tokenNumber,
    userQuestion,
    serviceName,
    peopleAhead,
    waitMinLower,
    waitMinUpper,
    activeCounters,
    requiredDocs,
  } = input;

  // Sensitive ID digits Redaction Guard
  const sensitiveRegex = /\b(\d{4}[-\s]?\d{4}[-\s]?\d{4}|\d{9,12}|\d{3}-\d{2}-\d{4})\b/g;
  const sanitizedQuestion = userQuestion.replace(sensitiveRegex, '[REDACTED ID]');

  // Fallback response generator
  const getFallbackChat = () => {
    const qLower = sanitizedQuestion.toLowerCase();
    let answer = `You currently have ${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead of you for ${serviceName}. Your estimated wait is ${waitMinLower}–${waitMinUpper} minutes.`;
    let recommendedAction: 'STAY_NEARBY' | 'CAN_LEAVE' | 'RETURN_IMMEDIATELY' = 'STAY_NEARBY';

    if (peopleAhead <= 2) {
      answer = `You are ${peopleAhead === 0 ? 'NEXT UP' : `${peopleAhead} ahead`}! Please head to the counter area immediately.`;
      recommendedAction = 'RETURN_IMMEDIATELY';
    } else if (qLower.includes('lunch') || qLower.includes('coffee') || qLower.includes('leave')) {
      if (waitMinLower >= 15 && peopleAhead > 3) {
        answer = `Yes! With an estimated wait of ${waitMinLower}–${waitMinUpper} minutes (${peopleAhead} ahead), you have enough time to step out. Please make sure to return when there are 3 people ahead.`;
        recommendedAction = 'CAN_LEAVE';
      } else {
        answer = `We recommend staying nearby. Your estimated wait is only ${waitMinLower}–${waitMinUpper} minutes (${peopleAhead} ahead).`;
        recommendedAction = 'STAY_NEARBY';
      }
    } else if (qLower.includes('doc') || qLower.includes('bring') || qLower.includes('paper')) {
      answer = `For ${serviceName}, please ensure you have the following required documents ready: ${requiredDocs.join(', ')}.`;
    }

    const now = new Date();
    const returnTime = new Date(now.getTime() + waitMinLower * 60 * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      answer,
      recommendedAction,
      suggestedReturnTimestamp: returnTime,
    };
  };

  if (!ai) {
    return getFallbackChat();
  }

  const customerChatPrompt = `${WAITWISE_SYSTEM_PROMPT}

The customer holding Token #${tokenNumber} asks: "${sanitizedQuestion}"

CURRENT REAL-TIME CONTEXT:
- Service Required: ${serviceName}
- Queue Position: ${peopleAhead} people ahead
- Estimated Wait Time: ${waitMinLower} to ${waitMinUpper} minutes
- Current Active Counters: ${activeCounters}
- Required Documents: ${requiredDocs.join(', ')}

Respond helpfully to the customer. Return ONLY a JSON object:
{
  "answer": "string",
  "recommendedAction": "STAY_NEARBY" | "CAN_LEAVE" | "RETURN_IMMEDIATELY",
  "suggestedReturnTimestamp": "HH:MM AM/PM"
}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: customerChatPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      const validated = AskAiResponseSchema.safeParse(parsed);
      if (validated.success) {
        // Redact any numbers accidentally generated in answer if sensitive
        validated.data.answer = validated.data.answer.replace(sensitiveRegex, '[REDACTED]');
        return validated.data;
      }
    }
    return getFallbackChat();
  } catch (error) {
    console.error('[Gemini SDK Error] Chat failed:', error);
    return getFallbackChat();
  }
}
