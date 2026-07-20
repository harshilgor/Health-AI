-- Public buckets serve objects by URL; remove broad SELECT that allows listing all files.
DROP POLICY IF EXISTS "Public read meal images" ON storage.objects;
