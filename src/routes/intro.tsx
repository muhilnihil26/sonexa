import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getIntroConfig } from "@/lib/api/social.functions";
import { useSession } from "@/lib/auth";
import { IntroExperience } from "@/components/sonexa/IntroExperience";

export const Route = createFileRoute("/intro")({
  head: () => ({ meta: [{ title: "Intro - Sonexa" }] }),
  component: IntroPage,
});

function parseYouTubeId(input: string) {
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1, 12);
    return url.searchParams.get("v") ?? "";
  } catch {
    return "";
  }
}

function IntroPage() {
  const getIntro = useServerFn(getIntroConfig);
  const { data } = useQuery({ queryKey: ["intro-config"], queryFn: () => getIntro() });
  const { user } = useSession();
  const videoId = parseYouTubeId(data?.youtubeUrl ?? "");
  const appLink = user ? "/home" : "/auth";
  const appLabel = user ? "Go to Home" : "Sign in";

  return (
    <IntroExperience
      videoId={videoId}
      tagline={data?.title || "Listen Beyond Limits"}
      appLink={appLink}
      appLabel={appLabel}
      photoUrl={data?.photoUrl ?? null}
      revealText={data?.revealText ?? null}
    />
  );
}
