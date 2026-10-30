# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stage4c.spec.ts >> R2 Mobile header >> single header, search icon, no page search input
- Location: tests/e2e/stage4c.spec.ts:75:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('h1')
Expected: 1
Received: 2
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" locator('h1') with timeout 5000ms
  - waiting for locator('h1')
    14 × locator resolved to 2 elements
       - unexpected value "2"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]:
        - link "V VinDeck" [ref=e7] [cursor=pointer]:
          - /url: /
          - generic [ref=e8]: V
          - generic [ref=e9]: VinDeck
        - generic [ref=e10]:
          - button "Search" [ref=e11]
          - button "Settings" [ref=e15]
      - generic [ref=e20]:
        - generic [ref=e21]:
          - heading "Good afternoon" [level=1] [ref=e22]
          - generic [ref=e23]: Friday, Oct 30 · 15:08
        - generic [ref=e24]: 0/4 online
      - generic [ref=e29]:
        - generic [ref=e30]:
          - button "All" [ref=e31]
          - button "★ Favorites" [ref=e32]
          - button "Media" [ref=e33]
          - button "Security" [ref=e34]
          - button "System" [ref=e35]
          - button "Files" [ref=e36]
        - generic [ref=e38]:
          - button "Grid" [ref=e39]
          - button "List" [ref=e42]
          - button "Compact" [ref=e44]
    - generic [ref=e48]:
      - link "Home" [ref=e49] [cursor=pointer]:
        - /url: /
      - button "Search" [ref=e54]
      - button "Add app" [ref=e59]
      - link "Notes" [ref=e61] [cursor=pointer]:
        - /url: /notes
      - button "Settings" [ref=e66]
    - main [ref=e71]:
      - generic [ref=e73]:
        - 'button "Immich, Self-hosted photo and video management, status: Offline" [ref=e75]':
          - button "Open Immich" [ref=e76] [cursor=pointer]
          - generic:
            - generic:
              - generic:
                - generic:
                  - img "Immich"
              - generic "Checked from this device 6s ago · 0 ms. Some apps block browser checks, so this may be inaccurate." [ref=e78]
            - generic:
              - heading "Immich" [level=3]
        - 'button "Vaultwarden, Self-hosted password manager, status: Offline" [ref=e81]':
          - button "Open Vaultwarden" [ref=e82] [cursor=pointer]
          - generic:
            - generic:
              - generic:
                - generic:
                  - img "Vaultwarden"
              - generic "Checked from this device 6s ago · 0 ms. Some apps block browser checks, so this may be inaccurate." [ref=e84]
            - generic:
              - heading "Vaultwarden" [level=3]
        - 'button "Server (Cockpit), Web-based Linux server administration, status: Offline" [ref=e87]':
          - button "Open Server (Cockpit)" [ref=e88] [cursor=pointer]
          - generic:
            - generic:
              - generic:
                - generic:
                  - img "Server (Cockpit)"
              - generic "Checked from this device 6s ago · 0 ms. Some apps block browser checks, so this may be inaccurate." [ref=e90]
            - generic:
              - heading "Server (Cockpit)" [level=3]
        - 'button "Filebrowser, Web-based file manager, status: Offline" [ref=e93]':
          - button "Open Filebrowser" [ref=e94] [cursor=pointer]
          - generic:
            - generic:
              - generic:
                - generic:
                  - img "Filebrowser"
              - generic "Checked from this device 6s ago · 0 ms. Some apps block browser checks, so this may be inaccurate." [ref=e96]
            - generic:
              - heading "Filebrowser" [level=3]
        - button "Add app" [ref=e98]
  - button "Open Next.js Dev Tools" [ref=e106] [cursor=pointer]
  - alert [ref=e110]: Good afternoon
```

# Test source

```ts
  1   | import { test, expect, devices } from "@playwright/test";
  2   | 
  3   | const BASE = "http://localhost:3100";
  4   | 
  5   | async function login(page: import("@playwright/test").Page) {
  6   |   await page.goto(BASE + "/login");
  7   |   await page.waitForSelector('input[type="password"]');
  8   |   await page.fill('input[type="password"]', "testpass123");
  9   |   await page.click('button[type="submit"]');
  10  |   await page.waitForLoadState("networkidle");
  11  |   
  12  |   // Small delay to avoid rate limiting
  13  |   await page.waitForTimeout(500);
  14  |   
  15  |   // Wait for dashboard to render
  16  |   await page.waitForSelector('[data-testid="app-header"]', { state: "visible" });
  17  | }
  18  | 
  19  | test.describe("R1 Desktop header", () => {
  20  |   test("1280px: one profile, settings gear, notes/add work", async ({ page }) => {
  21  |     await login(page);
  22  |     await page.setViewportSize({ width: 1280, height: 800 });
  23  |     await page.waitForTimeout(500);
  24  | 
  25  |     const header = page.locator('[data-testid="app-header"]');
  26  |     await expect(header).toBeVisible();
  27  | 
  28  |     // Exactly one profile/monogram element on the left side of header
  29  |     const leftSection = header.locator("> div").first();
  30  |     const profileElements = leftSection.locator(
  31  |       'img[alt="Profile"], .rounded-full'
  32  |     );
  33  |     await expect(profileElements).toHaveCount(1);
  34  | 
  35  |     const avatarMenu = page.locator('[aria-label="User menu"]');
  36  |     await expect(avatarMenu).toHaveCount(0);
  37  | 
  38  |     const settingsBtn = header.getByLabel("Settings");
  39  |     await expect(settingsBtn).toBeVisible();
  40  | 
  41  |     const notesLink = header.getByLabel("Notes");
  42  |     await expect(notesLink).toBeVisible();
  43  | 
  44  |     const addBtn = header.getByLabel("Add app");
  45  |     await expect(addBtn).toBeVisible();
  46  |   });
  47  | 
  48  |   test("1920px: same as 1280", async ({ page }) => {
  49  |     await login(page);
  50  |     await page.setViewportSize({ width: 1920, height: 1080 });
  51  |     await page.waitForTimeout(500);
  52  | 
  53  |     const header = page.locator('[data-testid="app-header"]');
  54  |     await expect(header).toBeVisible();
  55  | 
  56  |     // Exactly one profile/monogram element on the left side of header
  57  |     const leftSection = header.locator("> div").first();
  58  |     const profileElements = leftSection.locator(
  59  |       'img[alt="Profile"], .rounded-full'
  60  |     );
  61  |     await expect(profileElements).toHaveCount(1);
  62  | 
  63  |     const avatarMenu = page.locator('[aria-label="User menu"]');
  64  |     await expect(avatarMenu).toHaveCount(0);
  65  |   });
  66  | });
  67  | 
  68  | test.describe("R2 Mobile header", () => {
  69  |   test.beforeEach(async ({ page }) => {
  70  |     await login(page);
  71  |     await page.setViewportSize({ width: 390, height: 844 });
  72  |     await page.waitForTimeout(500);
  73  |   });
  74  | 
  75  |   test("single header, search icon, no page search input", async ({ page }) => {
  76  |     const header = page.locator('[data-testid="app-header"]');
  77  |     await expect(header).toBeVisible();
  78  | 
> 79  |     await expect(page.locator("h1")).toHaveCount(1);
      |                                      ^ Error: expect(locator).toHaveCount(expected) failed
  80  |     await expect(header).toHaveCount(1);
  81  |     await expect(page.locator('[data-testid="category-chips"]')).toHaveCount(1);
  82  |     await expect(page.locator('[data-testid="view-switcher"]')).toHaveCount(1);
  83  | 
  84  |     const searchInputs = page.locator(
  85  |       'input[type="search"], input[placeholder*="Search"]'
  86  |     );
  87  |     await expect(searchInputs).toHaveCount(0);
  88  | 
  89  |     const searchIcon = header.getByLabel("Search");
  90  |     await expect(searchIcon).toBeVisible();
  91  | 
  92  |     await searchIcon.click();
  93  |     await expect(page.locator("text=Search apps…")).toBeVisible();
  94  |   });
  95  | });
  96  | 
  97  | test.describe("R3 Hero", () => {
  98  |   test("greeting matches time, no username, correct spacing", async ({
  99  |     page,
  100 |   }) => {
  101 |     await login(page);
  102 |     await page.setViewportSize({ width: 1280, height: 800 });
  103 |     await page.waitForTimeout(500);
  104 | 
  105 |     const h1 = page.locator("h1");
  106 |     await expect(h1).toHaveText(/^Good (morning|afternoon|evening)$/);
  107 | 
  108 |     const heroText = await h1.textContent();
  109 |     expect(heroText).not.toMatch(/,\s*\w+/);
  110 | 
  111 |     await page.setViewportSize({ width: 390, height: 844 });
  112 |     await page.waitForTimeout(500);
  113 | 
  114 |     const mobileH1 = page.locator("h1");
  115 |     await expect(mobileH1).toHaveText(/^Good (morning|afternoon|evening)$/);
  116 |   });
  117 | });
  118 | 
  119 | test.describe("R4 Status", () => {
  120 |   test("online count pill color reflects state", async ({ page }) => {
  121 |     await login(page);
  122 |     await page.setViewportSize({ width: 1280, height: 800 });
  123 |     await page.waitForTimeout(500);
  124 | 
  125 |     const pills = page.locator(
  126 |       'text=/ online'
  127 |     );
  128 |     const count = await pills.count();
  129 |     if (count > 0) {
  130 |       const first = pills.first();
  131 |       const bg = await first.evaluate((el) => {
  132 |         return window.getComputedStyle(el).backgroundColor;
  133 |       });
  134 |       // Should not be green when 0 apps or 0 online
  135 |       expect(bg).not.toBe("rgb(0, 128, 0)");
  136 |     }
  137 |   });
  138 | });
  139 | 
  140 | test.describe("R5 Notes theme", () => {
  141 |   test("notes page light theme surfaces readable", async ({ page }) => {
  142 |     await login(page);
  143 |     await page.goto(BASE + "/notes");
  144 |     await page.waitForSelector("h1");
  145 | 
  146 |     await page.evaluate(() => {
  147 |       localStorage.setItem(
  148 |         "vindeck_settings_v2",
  149 |         JSON.stringify({ theme: "light" })
  150 |       );
  151 |       window.location.reload();
  152 |     });
  153 |     await page.waitForTimeout(500);
  154 | 
  155 |     const body = await page.evaluate(() => {
  156 |       const body = document.body;
  157 |       const style = window.getComputedStyle(body);
  158 |       return { bg: style.backgroundColor, color: style.color };
  159 |     });
  160 | 
  161 |     expect(body.bg).not.toBe("rgb(15, 23, 42)");
  162 |     expect(body.bg).not.toBe("rgb(2, 6, 23)");
  163 |   });
  164 | });
  165 | 
  166 | test.describe("R6 Duplicates", () => {
  167 |   test("legacy quick note imported once", async ({ page }) => {
  168 |     await login(page);
  169 |     await page.goto(BASE + "/notes");
  170 |     await page.waitForSelector("h1");
  171 | 
  172 |     await page.evaluate(() => {
  173 |       localStorage.removeItem("vindeck_notes_v2");
  174 |       localStorage.setItem(
  175 |         "vindeck_quick_notes",
  176 |         "This is a quick note from the old system"
  177 |       );
  178 |     });
  179 | 
```