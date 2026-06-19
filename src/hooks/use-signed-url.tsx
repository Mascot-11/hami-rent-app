/**
 * use-signed-url.tsx
 *
 * Shared resolver for the private "tenant-docs" bucket. Given either a
 * storage PATH ("<uid>/...") or a legacy full URL, returns a short-lived
 * signed URL suitable for <img src> / <a href>. Mirrors the pattern used in
 * tenants.tsx so QR / photo / document previews behave consistently.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSignedUrls } from "@/lib/storage.functions";

export function useSignedUrl(pathOrUrl: string | null | undefined) {
  const signFn = useServerFn(getSignedUrls);
  const isUrl = !!pathOrUrl && /^https?:\/\//.test(pathOrUrl);
  const { data } = useQuery({
    queryKey: ["signed-url", pathOrUrl],
    queryFn: async () => {
      if (!pathOrUrl) return null;
      const res = await signFn({ data: { paths: [pathOrUrl] } });
      return res[pathOrUrl] ?? null;
    },
    enabled: !!pathOrUrl && !isUrl,
    staleTime: 8 * 60 * 1000,
    retry: false,
  });
  return isUrl ? pathOrUrl! : (data ?? null);
}

export function SignedImg({
  path,
  alt,
  className,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const url = useSignedUrl(path);
  if (!url) return <div className={className} style={{ background: "var(--muted)" }} />;
  return <img src={url} alt={alt} className={className} />;
}
