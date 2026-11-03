export const MAX_IMAGE_BYTES = 5120 * 1024;
export const MAX_BATCH_FILES = 10;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",");
export const DELETE_CONFIRM_MESSAGE =
  "This image will be removed from the tour. The file is deleted from the server.";

const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const ACCEPTED_TYPE_SET = new Set(ACCEPTED_IMAGE_TYPES);

export function getFileExtension(name) {
  const match = /\.([^.\\/]+)$/.exec(String(name ?? ""));
  return match ? match[1].toLowerCase() : "";
}

export function validateImageFile(file) {
  if (!file) {
    return "Choose a file.";
  }

  const type = String(file.type ?? "").toLowerCase();
  if (!ACCEPTED_TYPE_SET.has(type)) {
    return "Only JPEG, PNG or WebP images are allowed.";
  }

  if (!ACCEPTED_EXTENSIONS.has(getFileExtension(file.name))) {
    return "The file extension must be .jpg, .jpeg, .png or .webp.";
  }

  if (Number(file.size) > MAX_IMAGE_BYTES) {
    return "The file is larger than 5120 KB.";
  }

  return null;
}

export function prepareUploadFiles(files) {
  return Array.from(files ?? []).map((file, index) => {
    const reason =
      index >= MAX_BATCH_FILES
        ? `Up to ${MAX_BATCH_FILES} files can be uploaded at a time.`
        : validateImageFile(file);
    return { file, reason };
  });
}
