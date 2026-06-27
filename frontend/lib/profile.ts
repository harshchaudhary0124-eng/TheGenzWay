import type { DiscoveredPerson, ProfileDomain } from "@/lib/discover";
import type { ForumInvite } from "@/lib/forum";

// Canonical, viewer-independent shape of a user profile.
//
// This is the single shape that <ProfileModal /> renders. Any feature that
// needs to show someone's profile — discovery, forums, @mentions, a future
// dedicated /profile/[slug] page — should build one of these and hand it to
// the modal. Keep it free of viewer-relative concepts (matched_domains,
// why_matched, "in common"): those are passed separately as render hints.
export type ProfileData = {
  full_name: string;
  city: string;
  country: string;
  // Every domain this person belongs to (their complete profile).
  domains: ProfileDomain[];
};

// Adapter: turn a discovery result into the canonical profile shape.
// `all_domains` is the viewer-independent full profile; `matched_domains`
// stays behind so the modal isn't coupled to discovery.
export function profileFromDiscovered(person: DiscoveredPerson): ProfileData {
  return {
    full_name: person.full_name,
    city: person.city,
    country: person.country,
    domains: person.all_domains,
  };
}

// Adapter: turn a forum invite's sender into the canonical profile shape.
// The invite endpoint already returns one entry per domain the sender belongs
// to (each with answers + identity summary), so `matched_domains` is the
// sender's complete profile — we just drop `why_matched`, which is a
// viewer-relative discovery hint the modal doesn't consume.
export function profileFromInviteSender(sender: ForumInvite["sender"]): ProfileData {
  return {
    full_name: sender.full_name,
    city: sender.city,
    country: sender.country,
    domains: sender.matched_domains.map(({ domain, onboarding_answers, identity_summary }) => ({
      domain,
      onboarding_answers,
      identity_summary,
    })),
  };
}
