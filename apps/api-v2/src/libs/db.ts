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

export const getSession = async (sessionId: string) => {
  return await db.query.sessionTable.findFirst({
    where: {
      id: sessionId,
    },
  });
};

export const getAgent = async (agentId: string) => {
  return await db.query.agentContainerTable.findFirst({
    where: {
      agentId,
    },
  });
};
