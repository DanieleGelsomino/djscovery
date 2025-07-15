export const uploadToCloudinary = async (base64Image) => {
  const formData = new FormData();
  formData.append("file", base64Image);
  formData.append("upload_preset", "unsigned_presed");
  formData.append("cloud_name", "de661ymig");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/de661ymig/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) throw new Error("Upload fallito");

  const data = await res.json();
  return data.secure_url;
};
