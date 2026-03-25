"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import type { PublicAnalyticsEventName } from "@/lib/analytics";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

interface TrackedExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  event: PublicAnalyticsEventName;
  tracking?: {
    slug?: string;
    locale?: string;
    category?: string;
    ctaId?: string;
    placement?: string;
    revenueCents?: number;
  };
}

export default function TrackedExternalLink({
  event,
  href,
  onClick,
  tracking,
  ...props
}: TrackedExternalLinkProps) {
  const handleClick = (clickEvent: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(clickEvent);

    if (clickEvent.defaultPrevented) {
      return;
    }

    trackAnalyticsEvent({
      event,
      outboundUrl: typeof href === "string" ? href : undefined,
      ...tracking,
    });
  };

  return <a {...props} href={href} onClick={handleClick} />;
}
