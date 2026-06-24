-- Create storage bucket for journal audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-audio', 'journal-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload their own audio
CREATE POLICY "upload_own_audio" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'journal-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy to allow public read access
CREATE POLICY "read_audio" ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'journal-audio');

-- Policy to allow users to delete their own audio
CREATE POLICY "delete_own_audio" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'journal-audio' AND (storage.foldername(name))[1] = auth.uid()::text);