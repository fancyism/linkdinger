import { ImageResponse } from "next/og";
import { getPromptBySlug } from "@/lib/prompts";
import { getPlatformColor } from "@/lib/prompt-types";

export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

export async function generatePromptSocialImage(
  locale: string,
  slug: string,
) {
  const prompt = getPromptBySlug(slug, locale);

  if (!prompt) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, #120d0b 0%, #171110 42%, #1a1a1a 100%)",
            color: "white",
            fontSize: 54,
            fontWeight: 700,
          }}
        >
          Prompt not found
        </div>
      ),
      size,
    );
  }

  const platformColor = getPlatformColor(prompt.platform);
  const summary = truncate(prompt.excerpt || prompt.content || prompt.promptText, 180);
  const title = truncate(prompt.title, 92);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 78% 24%, rgba(255,140,90,0.20), transparent 28%), radial-gradient(circle at 18% 82%, rgba(255,107,53,0.18), transparent 30%), linear-gradient(135deg, #120d0b 0%, #171110 42%, #1a1a1a 100%)",
          color: "white",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 24,
            borderRadius: 30,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.03)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.30)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 30,
            left: 40,
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 84,
              height: 84,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              border: "2px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.06)",
              color: "#FF6B35",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            lind
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: "#FF6B35",
                lineHeight: 1,
              }}
            >
              Linkdinger
            </div>
            <div
              style={{
                fontSize: 20,
                letterSpacing: 2.4,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.72)",
              }}
            >
              AI Prompt Gallery
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: 150,
            left: 52,
            right: 52,
            bottom: 52,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                borderRadius: 999,
                background: platformColor,
                color: "#111111",
                border: "2px solid rgba(255,255,255,0.92)",
                padding: "10px 20px",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                boxShadow: "4px 4px 0 rgba(255,255,255,0.78)",
              }}
            >
              {prompt.platform}
            </div>
            <div
              style={{
                display: "flex",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.88)",
                border: "1px solid rgba(255,255,255,0.16)",
                padding: "10px 18px",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              {prompt.category}
            </div>
            <div
              style={{
                display: "flex",
                marginLeft: "auto",
                borderRadius: 18,
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.74)",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "12px 18px",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              {prompt.promptId}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                display: "flex",
                fontSize: 68,
                fontWeight: 800,
                lineHeight: 1.04,
                maxWidth: 980,
                textWrap: "balance",
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: 920,
                fontSize: 32,
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.76)",
              }}
            >
              {summary}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 12,
                color: "rgba(255,255,255,0.66)",
                fontSize: 24,
              }}
            >
              {(prompt.tags || []).slice(0, 3).map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: "flex",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    padding: "8px 16px",
                  }}
                >
                  #{tag}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 20,
                color: "rgba(255,255,255,0.58)",
              }}
            >
              {prompt.locale.toUpperCase()} prompt preview
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
