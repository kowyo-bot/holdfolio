ALTER TABLE "items" ADD COLUMN "ended_at" date;--> statement-breakpoint
CREATE INDEX "items_ended_at_idx" ON "items" USING btree ("ended_at");