// Test-only helpers for driving the mocked PubSub channel from test code.
//
// This mock must stay in sync with the return shapes of
// `@concord-consortium/lara-interactive-api` as used by BaseApp / BaseAuthoring.
// When bumping the API version (currently pinned at 1.13.0 via package.json),
// verify the hook return shapes (useAuthoredState, useInteractiveState,
// useAccessibility) haven't changed.

type Handler = (message: any) => void;

interface MockChannel {
  channelId: string;
  handlers: Handler[];
  disposed: boolean;
}

const channels: Record<string, MockChannel> = {};
let mostRecent: MockChannel | null = null;

export const createPubSubChannel = jest.fn((channelId: string) => {
  const channel: MockChannel = {
    channelId,
    handlers: [],
    disposed: false,
  };
  channels[channelId] = channel;
  mostRecent = channel;
  return {
    publish: jest.fn(),
    subscribe: (handler: Handler) => {
      channel.handlers.push(handler);
      return () => {
        channel.handlers = channel.handlers.filter(h => h !== handler);
      };
    },
    dispose: () => {
      channel.disposed = true;
    },
    getChannelId: () => channelId,
  };
});

export const __emitMessage = (message: any, channelId?: string) => {
  const channel = channelId ? channels[channelId] : mostRecent;
  if (!channel) {
    throw new Error("No mock channel available to emit against.");
  }
  channel.handlers.forEach(h => h(message));
};

export const __getMockChannel = (channelId?: string): MockChannel | null => {
  return channelId ? channels[channelId] ?? null : mostRecent;
};

export const __resetMockChannels = () => {
  Object.keys(channels).forEach(k => delete channels[k]);
  mostRecent = null;
  (createPubSubChannel as jest.Mock).mockClear();
};

// Stubs for the rest of the lara-interactive-api surface touched indirectly via
// BaseApp / BaseAuthoring. Individual test files can override any of these via
// jest.mocked(...).mockReturnValue(...).

export const log = jest.fn();
export const useInitMessage = jest.fn();
export const useAuthoredState = jest.fn(() => ({ authoredState: null, setAuthoredState: jest.fn() }));
export const useInteractiveState = jest.fn(() => ({ interactiveState: null }));
export const setSupportedFeatures = jest.fn();
export const setLinkedInteractives = jest.fn();
export const getFirebaseJwt = jest.fn().mockResolvedValue({ token: "test" });
export const getInteractiveList = jest.fn().mockResolvedValue({ interactives: [] });
export const getClient = jest.fn(() => ({ addListener: jest.fn() }));
export const useAccessibility = jest.fn(() => ({}));
