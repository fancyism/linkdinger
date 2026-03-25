"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

export default function NewsletterForm({
  placement = "newsletter_form",
}: {
  placement?: string;
}) {
  const t = useTranslations("Newsletter");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const buttondownUsername = "linkdinger"; // TODO: Replace with real Buttondown username

  // Using Buttondown's built-in form action (opens in new tab)
  return (
    <form
      action={`https://buttondown.com/api/emails/embed-subscribe/${buttondownUsername}`}
      method="post"
      target="popupwindow"
      onSubmit={() => {
        setStatus("submitting");
        trackAnalyticsEvent({
          event: "email_opt_in",
          ctaId: placement,
          placement,
        });
        window.open(
          `https://buttondown.com/${buttondownUsername}`,
          "popupwindow",
        );
        setTimeout(() => setStatus("success"), 1000);
      }}
      className="flex gap-2 max-w-md mx-auto sm:mx-0"
    >
      <input
        type="email"
        name="email"
        id="bd-email"
        required
        placeholder={t("emailPlaceholder")}
        className="glass-input text-sm flex-1"
        aria-label={t("emailLabel")}
      />
      <button
        type="submit"
        disabled={status === "submitting" || status === "success"}
        className="brutal-btn whitespace-nowrap disabled:opacity-50"
      >
        {status === "success" ? t("subscribed") : t("subscribe")}
      </button>
    </form>
  );
}
