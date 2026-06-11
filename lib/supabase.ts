/**
 * Lightweight Supabase Storage file upload helper using REST API.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEFAULT_BUCKET = 'proposals';

export async function uploadToSupabase(
  file: File,
  bucketName: string = DEFAULT_BUCKET
): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables are missing. Using local object URL placeholder.");
    return URL.createObjectURL(file);
  }

  // Clean filename to prevent path issues
  const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucketName}/${cleanFileName}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload file to Supabase: ${errText || response.statusText}`);
  }

  // Return the public URL for the file
  return `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${cleanFileName}`;
}
