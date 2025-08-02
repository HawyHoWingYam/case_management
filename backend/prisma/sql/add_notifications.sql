-- CreateEnum for NotificationType
CREATE TYPE "NotificationType" AS ENUM ('CASE_ASSIGNED', 'CASE_ACCEPTED', 'CASE_REJECTED', 'CASE_STATUS_CHANGED', 'CASE_PRIORITY_CHANGED', 'CASE_COMMENT_ADDED', 'SYSTEM_ANNOUNCEMENT');

-- CreateTable for notifications
CREATE TABLE "notifications" (
    "notification_id" SERIAL NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "sender_id" INTEGER,
    "recipient_id" INTEGER NOT NULL,
    "case_id" INTEGER,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE INDEX "notifications_recipient_id_idx" ON "notifications"("recipient_id");
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");
CREATE INDEX "notifications_case_id_idx" ON "notifications"("case_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("case_id") ON DELETE CASCADE ON UPDATE CASCADE;