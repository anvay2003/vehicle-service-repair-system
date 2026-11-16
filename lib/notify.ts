import type { Prisma } from "@prisma/client";

type Db = Pick<Prisma.TransactionClient, "notification">;

export function notify(db: Db, userId: string, message: string, workOrderId?: string) {
  return db.notification.create({ data: { userId, message, workOrderId } });
}