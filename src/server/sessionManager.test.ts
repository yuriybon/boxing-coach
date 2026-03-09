import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionManager } from './sessionManager';

describe('SessionManager', () => {
  let mockWs: any;
  let mockGenAI: any;
  let mockSession: any;
  let sessionManager: SessionManager;

  beforeEach(() => {
    vi.clearAllMocks();

    mockWs = {
      send: vi.fn(),
      on: vi.fn(),
      close: vi.fn(),
    };

    mockSession = {
      sendRealtimeInput: vi.fn(),
      close: vi.fn(),
    };

    mockGenAI = {
      live: {
        connect: vi.fn().mockResolvedValue(mockSession),
      },
    };

    // @ts-ignore
    sessionManager = new SessionManager(mockWs, mockGenAI);
  });

  it('starts in CONCIERGE mode with correct prompt', async () => {
    await sessionManager.start();

    // Check if send was called with error (debugging)
    if (mockWs.send.mock.calls.length > 0) {
        console.log("WS Send calls:", mockWs.send.mock.calls);
    }

    expect(mockGenAI.live.connect).toHaveBeenCalledWith(expect.objectContaining({
      config: expect.objectContaining({
        systemInstruction: expect.stringContaining('You are the "Concierge"'),
        tools: expect.arrayContaining([
            expect.objectContaining({
                functionDeclarations: expect.arrayContaining([
                    expect.objectContaining({ name: 'plan_session' })
                ])
            })
        ]),
      }),
    }));
  });

  it('transitions to COACH mode when plan_session tool is called', async () => {
    await sessionManager.start();

    expect(mockGenAI.live.connect).toHaveBeenCalledTimes(1);

    const connectCall = mockGenAI.live.connect.mock.calls[0][0];
    // We need to find where the tool handler is attached.
    // In the implementation it is in callbacks.ontoolcall
    const onToolCallCallback = connectCall.callbacks?.ontoolcall;
    
    if (!onToolCallCallback) {
        console.log("Callbacks received:", connectCall.callbacks);
        throw new Error("ontoolcall callback was not registered in connect options");
    }

    const toolCall = {
        functionCalls: [{
          name: 'plan_session',
          args: { injuries: 'none', energy: 'high', focus: 'speed' }
        }]
    };

    // Trigger the tool call
    await onToolCallCallback(toolCall);

    // Expect old session closed
    expect(mockSession.close).toHaveBeenCalled();
    
    // Expect new session connected (Coach)
    expect(mockGenAI.live.connect).toHaveBeenCalledTimes(2);
    
    const secondConnectCall = mockGenAI.live.connect.mock.calls[1][0];
    expect(secondConnectCall.config.systemInstruction).toContain('User Injuries/Status: none');
    expect(secondConnectCall.config.systemInstruction).toContain('User Energy: high');
    expect(secondConnectCall.config.systemInstruction).toContain('User Focus: speed');
  });
});