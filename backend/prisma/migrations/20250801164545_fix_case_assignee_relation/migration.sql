-- AddForeignKey
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
