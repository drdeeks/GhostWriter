jest.mock('@farcaster/miniapp-sdk', () => ({
  sdk: {
    actions: {
      ready: jest.fn().mockResolvedValue(undefined),
      openUrl: jest.fn().mockResolvedValue(undefined),
    },
    context: null,
  },
}));

jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Test Story\nA [ADJECTIVE] hero went on a [NOUN] quest.',
              },
            },
          ],
        }),
      },
    },
    moderations: {
      create: jest.fn().mockResolvedValue({
        results: [{ flagged: false, categories: {}, category_scores: {} }],
      }),
    },
  })),
}));
