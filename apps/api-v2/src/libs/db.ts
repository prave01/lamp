import { db } from "../db/index";

export const listSessions = async () => {
  const sessions = await db.query.sessionTable.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  return sessions;
};

export const listSessionMessages = async (sessionId: string) => {
  return await db.query.messageTable.findMany({
    where: {
      sessionId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};
