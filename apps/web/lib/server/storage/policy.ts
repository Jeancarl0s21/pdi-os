export const uploadPolicy = {
  avatar: { maxBytes: 2 * 1024 * 1024, mime: ["image/jpeg", "image/png", "image/webp"] },
  projectCover: { maxBytes: 5 * 1024 * 1024, mime: ["image/jpeg", "image/png", "image/webp"] },
  evidence: {
    maxBytes: 5 * 1024 * 1024,
    mime: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/plain",
      "text/csv",
      "application/json",
      "application/x-ipynb+json",
    ],
  },
} as const;

export type UploadKind = keyof typeof uploadPolicy;
export function validateDeclaredUpload(kind: UploadKind, size: number, mime: string) {
  const policy = uploadPolicy[kind];
  if (!Number.isInteger(size) || size <= 0 || size > policy.maxBytes)
    return { ok: false as const, reason: "size" };
  if (!(policy.mime as readonly string[]).includes(mime))
    return { ok: false as const, reason: "mime" };
  return { ok: true as const };
}

export function sniffActiveContent(bytes: Uint8Array) {
  const prefix = new TextDecoder().decode(bytes.slice(0, 1024)).toLowerCase();
  return /<\s*(script|html|svg)|javascript\s*:/.test(prefix);
}

export function validateMagicBytes(mime: string, bytes: Uint8Array) {
  if (sniffActiveContent(bytes)) return false;
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png")
    return bytes.slice(0, 8).every((b, i) => b === [137, 80, 78, 71, 13, 10, 26, 10][i]);
  if (mime === "image/webp")
    return (
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
    );
  if (mime === "application/pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (mime === "application/json" || mime === "application/x-ipynb+json") {
    try {
      JSON.parse(new TextDecoder().decode(bytes));
      return true;
    } catch {
      return false;
    }
  }
  if (mime === "text/plain" || mime === "text/csv") return true;
  return false;
}
