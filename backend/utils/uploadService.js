import supabase from "../lib/supabase.js";

// ── upload charity image — public bucket ──
// charity images managed by admin
export const uploadCharityImage = async (fileBuffer, fileName, mimeType) => {
  try {
    const filePath = `${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
      .from("charity-images")
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) throw new Error(error.message);

    // get public URL
    const { data: urlData } = supabase.storage
      .from("charity-images")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.error("Charity image upload failed:", err.message);
    throw err;
  }
};

// ── upload winner proof — private bucket ──
// winner uploads screenshot for verification
export const uploadWinnerProof = async (
  fileBuffer,
  fileName,
  mimeType,
  userId,
) => {
  try {
    const filePath = `${userId}/${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
      .from("winner-proofs")
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) throw new Error(error.message);

    // return path only — private bucket, no public URL
    return filePath;
  } catch (err) {
    console.error("Winner proof upload failed:", err.message);
    throw err;
  }
};

// ── get signed URL for winner proof (admin viewing) ──
export const getWinnerProofUrl = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from("winner-proofs")
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw new Error(error.message);
    return data.signedUrl;
  } catch (err) {
    console.error("Signed URL generation failed:", err.message);
    throw err;
  }
};

// ── delete charity image ──
export const deleteCharityImage = async (imageUrl) => {
  try {
    // extract file path from URL
    const filePath = imageUrl.split("/charity-images/")[1];
    if (!filePath) return;

    const { error } = await supabase.storage
      .from("charity-images")
      .remove([filePath]);

    if (error) throw new Error(error.message);
  } catch (err) {
    console.error("Charity image delete failed:", err.message);
  }
};
