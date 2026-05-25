export async function removeBackground(file: File) {
  const apiKey = process.env.REMOVE_BG_API_KEY;

  if (!apiKey) {
    return { removed: false, warning: "REMOVE_BG_API_KEY is missing." };
  }

  const form = new FormData();
  form.append("image_file", file);
  form.append("size", "auto");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: form,
  });

  if (!response.ok) {
    return {
      removed: false,
      warning: `remove.bg returned ${response.status}.`,
    };
  }

  const blob = await response.blob();
  const output = new File([blob], file.name.replace(/\.[^.]+$/, "") + "-cutout.png", {
    type: "image/png",
  });

  return { removed: true, file: output };
}
