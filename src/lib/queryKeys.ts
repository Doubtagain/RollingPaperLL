export const queryKeys = {
  members: ['members'] as const,
  boardSummaries: ['board-summaries'] as const,
  boardSummary: (boardId: string) => ['board-summary', boardId] as const,
  myWrittenMemberIds: ['my-written-member-ids'] as const,
  myMessage: (boardId: string) => ['my-message', boardId] as const,
  myBoardMessages: (boardId: string) => ['my-board-messages', boardId] as const,
  admin: {
    all: ['admin'] as const,
    stats: ['admin', 'stats'] as const,
    members: ['admin', 'members'] as const,
    messages: ['admin', 'messages'] as const,
  },
};
