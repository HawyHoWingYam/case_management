/*
  Warnings:

  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'MANAGER', 'USER');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('CASE_ASSIGNED', 'CASE_ACCEPTED', 'CASE_REJECTED', 'CASE_STATUS_CHANGED', 'CASE_PRIORITY_CHANGED', 'CASE_COMMENT_ADDED', 'SYSTEM_ANNOUNCEMENT');

-- DropForeignKey
ALTER TABLE "public"."case_logs" DROP CONSTRAINT "case_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."cases" DROP CONSTRAINT "cases_created_by_fkey";

-- AlterTable
ALTER TABLE "public"."cases" ADD COLUMN     "due_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "role",
ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'USER';

-- DropEnum
DROP TYPE "public"."UserRole";

-- CreateTable
CREATE TABLE "public"."notifications" (
    "notification_id" SERIAL NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
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
CREATE INDEX "notifications_recipient_id_idx" ON "public"."notifications"("recipient_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "public"."notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "public"."notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_case_id_idx" ON "public"."notifications"("case_id");

-- CreateIndex
CREATE INDEX "case_logs_case_id_idx" ON "public"."case_logs"("case_id");

-- CreateIndex
CREATE INDEX "case_logs_user_id_idx" ON "public"."case_logs"("user_id");

-- CreateIndex
CREATE INDEX "case_logs_created_at_idx" ON "public"."case_logs"("created_at");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "public"."cases"("status");

-- CreateIndex
CREATE INDEX "cases_priority_idx" ON "public"."cases"("priority");

-- CreateIndex
CREATE INDEX "cases_created_by_idx" ON "public"."cases"("created_by");

-- CreateIndex
CREATE INDEX "cases_assigned_to_idx" ON "public"."cases"("assigned_to");

-- CreateIndex
CREATE INDEX "cases_created_at_idx" ON "public"."cases"("created_at");

-- AddForeignKey
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."case_logs" ADD CONSTRAINT "case_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("case_id") ON DELETE CASCADE ON UPDATE CASCADE;
