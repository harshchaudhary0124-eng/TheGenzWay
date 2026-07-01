import { test, expect, type APIRequestContext } from "@playwright/test";

const API = "http://127.0.0.1:8000";
const DOMAIN = "Artificial Intelligence";

/** Seed a fully-onboarded user + a forum via the API, return token + forum id.
 *  Lets us exercise the authenticated buttons without driving the long
 *  multi-field register/onboarding forms (those are covered separately). */
async function seedUser(request: APIRequestContext) {
  const email = `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@ex.com`;
  const reg = await request.post(`${API}/auth/register`, {
    data: {
      full_name: "E2E Tester", email, password: "supersecret123",
      qualification: "College Student", interested_domains: [DOMAIN],
      country: "India", city: "Delhi",
    },
  });
  expect(reg.ok()).toBeTruthy();
  const { access_token } = await reg.json();
  const auth = { Authorization: `Bearer ${access_token}` };

  const onb = await request.post(`${API}/auth/onboarding`, {
    headers: auth,
    data: { domains_data: [{ domain: DOMAIN, answers: { q1: "a", q2: "b", q3: "c", q4: "d" } }] },
  });
  expect(onb.ok()).toBeTruthy();

  const f = await request.post(`${API}/forums`, {
    headers: auth, data: { name: "E2E Forum", domain: DOMAIN },
  });
  expect(f.ok()).toBeTruthy();
  const forum = await f.json();
  return { token: access_token as string, forumId: forum.id as number };
}

test.describe("Authenticated buttons & navigation", () => {
  test("welcome → navbar panels → open forum → logout", async ({ page, context, request }) => {
    const { token, forumId } = await seedUser(request);
    // Inject the auth token before any page script runs.
    await context.addInitScript((t) => { window.localStorage.setItem("tgw_token", t); }, token);

    // Welcome hub renders for the onboarded user.
    await page.goto("/welcome");
    await expect(page.getByText(/Hi,/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/People on your wavelength/i)).toBeVisible();

    // Invites button opens its panel.
    await page.getByRole("button", { name: /invites/i }).click();
    await expect(page.getByText(/Discussion Invites/i)).toBeVisible();

    // My Forums button opens its panel and lists the seeded forum.
    await page.getByRole("button", { name: /my forums/i }).click();
    await expect(page.getByText("E2E Forum")).toBeVisible();

    // Clicking the forum navigates to the chat page and loads its UI.
    await page.getByText("E2E Forum").click();
    await expect(page).toHaveURL(new RegExp(`/forums/${forumId}$`));
    await expect(page.getByRole("heading", { name: "E2E Forum" })).toBeVisible({ timeout: 15_000 }); // top bar
    await expect(page.locator("textarea").first()).toBeVisible({ timeout: 15_000 }); // composer

    // Hamburger menu → Log out → back to /login.
    await page.goto("/welcome");
    await page.getByRole("button", { name: /open menu/i }).click();
    await page.getByRole("button", { name: /log out/i }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("'Create Forum & Send Invite' confirms instantly (optimistic, not gated on network)", async ({ page, context, request }) => {
    // Two onboarded same-domain users so the inviter discovers the other.
    const me = await seedUser(request);
    const otherName = `Builder ${Date.now().toString().slice(-6)}`;
    const reg = await request.post(`${API}/auth/register`, {
      data: {
        full_name: otherName, email: `e2e_o_${Date.now()}@ex.com`, password: "supersecret123",
        qualification: "College Student", interested_domains: [DOMAIN], country: "India", city: "Delhi",
      },
    });
    const { access_token: otherTok } = await reg.json();
    await request.post(`${API}/auth/onboarding`, {
      headers: { Authorization: `Bearer ${otherTok}` },
      data: { domains_data: [{ domain: DOMAIN, answers: { q1: "a", q2: "b", q3: "c", q4: "d" } }] },
    });

    await context.addInitScript((t) => { window.localStorage.setItem("tgw_token", t); }, me.token);

    // Make the invite API artificially SLOW (2s) — the confirmation must NOT wait for it.
    await page.route("**/forums/invite", async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });

    await page.goto("/welcome");
    await expect(page.getByRole("button", { name: /Add to Discussion Forum/i }).first())
      .toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /Add to Discussion Forum/i }).first().click();
    await page.getByRole("button", { name: /Create a new discussion forum/i }).click();
    await page.getByPlaceholder(/AI Builders/i).fill("E2E Optimistic Forum");

    const t0 = Date.now();
    await page.getByRole("button", { name: /Create Forum & Send Invite/i }).click();
    // Confirmation appears immediately even though the API is delayed by 2s.
    await expect(page.getByText(/Invite sent/i)).toBeVisible({ timeout: 1500 });
    expect(Date.now() - t0).toBeLessThan(1000);
  });
});
