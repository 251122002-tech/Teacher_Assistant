-- v0.3: login throttling columns (NFR-S5) and refresh tokens (FR-08, FR-09, NFR-S2).

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "failed_login_attempts" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "last_failed_login_at" TIMESTAMPTZ(6),
ADD COLUMN     "locked_until" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "replaced_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- CHECK constraints (hand-written: Prisma schema cannot express CHECK)
-- ---------------------------------------------------------------------------

-- users
ALTER TABLE "users" ADD CONSTRAINT "users_failed_login_attempts_chk" CHECK ("failed_login_attempts" BETWEEN 0 AND 1000);

-- refresh_tokens
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_token_hash_format_chk" CHECK ("token_hash" ~ '^[0-9a-f]{64}$');
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_expiry_after_creation_chk" CHECK ("expires_at" > "created_at");
