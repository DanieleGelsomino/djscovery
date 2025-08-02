export const uploadToCloudinary = async (base64Image) => {
  const preset = import.meta.env.VITE_CLOUDINARY_PRESET;
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  if (!preset || !cloudName) {
    throw new Error("Cloudinary not configured");
  }

  const formData = new FormData();
  formData.append("file", base64Image);
  formData.append("upload_preset", preset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${text}`);
  }

  const data = await res.json();
  return data.secure_url;
};
