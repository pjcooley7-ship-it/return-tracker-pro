-- Enable pgcrypto extension (available on all Supabase plans)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Store the encryption passphrase as a Vault secret.
-- In production, set this via the Supabase dashboard:
--   SELECT vault.create_secret('my-strong-passphrase', 'token_encryption_key');
-- For migration purposes we create a placeholder; replace it before first use.
DO $$
BEGIN
  -- Only create if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM vault.secrets WHERE name = 'token_encryption_key'
  ) THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'token_encryption_key',
      'Symmetric key for encrypting OAuth tokens in connected_accounts'
    );
  END IF;
END $$;

-- Helper: encrypt plaintext token → PGP-armored ciphertext
CREATE OR REPLACE FUNCTION public.encrypt_token(plaintext text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  passphrase text;
BEGIN
  SELECT decrypted_secret INTO passphrase
    FROM vault.decrypted_secrets
    WHERE name = 'token_encryption_key'
    LIMIT 1;

  IF passphrase IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in Vault';
  END IF;

  RETURN encode(
    pgp_sym_encrypt(plaintext, passphrase),
    'base64'
  );
END;
$$;

-- Helper: decrypt base64-encoded PGP ciphertext → plaintext
CREATE OR REPLACE FUNCTION public.decrypt_token(ciphertext text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  passphrase text;
BEGIN
  SELECT decrypted_secret INTO passphrase
    FROM vault.decrypted_secrets
    WHERE name = 'token_encryption_key'
    LIMIT 1;

  IF passphrase IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in Vault';
  END IF;

  RETURN pgp_sym_decrypt(
    decode(ciphertext, 'base64'),
    passphrase
  );
END;
$$;

-- Restrict these functions to service_role only
REVOKE ALL ON FUNCTION public.encrypt_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.encrypt_token(text) FROM anon;
REVOKE ALL ON FUNCTION public.encrypt_token(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_token(text) TO service_role;

REVOKE ALL ON FUNCTION public.decrypt_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrypt_token(text) FROM anon;
REVOKE ALL ON FUNCTION public.decrypt_token(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_token(text) TO service_role;

-- Migrate existing plaintext tokens in-place.
-- This is safe: pgp_sym_encrypt output is binary and will base64-encode to
-- something that does NOT look like a JWT (no dots), so we can detect
-- already-encrypted rows by checking for the absence of '.' in the value.
UPDATE public.connected_accounts
SET
  access_token_encrypted = public.encrypt_token(access_token_encrypted),
  refresh_token_encrypted = public.encrypt_token(refresh_token_encrypted)
WHERE access_token_encrypted IS NOT NULL
  AND access_token_encrypted LIKE '%.%';
