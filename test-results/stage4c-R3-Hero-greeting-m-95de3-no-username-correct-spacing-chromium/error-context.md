# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stage4c.spec.ts >> R3 Hero >> greeting matches time, no username, correct spacing
- Location: tests/e2e/stage4c.spec.ts:98:7

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('h1')
Expected pattern: /^Good (morning|afternoon|evening)$/
Error: strict mode violation: locator('h1') resolved to 2 elements:
    1) <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">Good afternoon</h1> aka getByTestId('app-header').getByRole('heading', { name: 'Good afternoon' })
    2) <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 light:text-slate-900 truncate">Good afternoon</h1> aka getByRole('main').getByRole('heading', { name: 'Good afternoon' })

Call log:
  - Expect "toHaveText" locator('h1') with timeout 5000ms
  - waiting for locator('h1')

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
        - button "Search apps" [ref=e11]:
          - generic [ref=e12]: Search apps…
          - generic [ref=e17]:
            - generic [ref=e18]: /
            - generic [ref=e19]: or
            - generic [ref=e20]: ⌘K
        - generic [ref=e21]:
          - link "Notes" [ref=e22] [cursor=pointer]:
            - /url: /notes
          - button "Add app" [ref=e27]
          - button "Settings" [ref=e30]
      - generic [ref=e35]:
        - generic [ref=e36]:
          - heading "Good afternoon" [level=1] [ref=e37]
          - generic [ref=e38]: Friday, Oct 30 · 15:08
        - generic [ref=e39]: 0/4 online
      - generic [ref=e44]:
        - generic [ref=e45]:
          - button "All" [ref=e46]
          - button "★ Favorites" [ref=e47]
          - button "Media" [ref=e48]
          - button "Security" [ref=e49]
          - button "System" [ref=e50]
          - button "Files" [ref=e51]
        - generic [ref=e53]:
          - button "Grid" [ref=e54]
          - button "List" [ref=e58]
          - button "Compact" [ref=e61]
    - main [ref=e65]:
      - generic [ref=e66]:
        - generic [ref=e67]:
          - heading "Good afternoon" [level=1] [ref=e68]
          - generic [ref=e69]: Friday, October 30, 2026 at 15:08:10
        - generic [ref=e70]: 0/4 online
      - generic [ref=e74]:
        - generic [ref=e75]:
          - button "All" [ref=e76]
          - button "★ Favorites" [ref=e77]
          - button "Media" [ref=e78]
          - button "Security" [ref=e79]
          - button "System" [ref=e80]
          - button "Files" [ref=e81]
        - generic [ref=e83]:
          - button "Grid" [ref=e84]
          - button "List" [ref=e88]
          - button "Compact" [ref=e91]
      - generic [ref=e96]:
        - 'button "Immich, Self-hosted photo and video management, status: Offline" [ref=e98]':
          - button "Open Immich" [ref=e99] [cursor=pointer]
          - generic:
            - generic:
              - generic:
                - generic:
                  - img "Immich"
              - generic "Checked from this device 1s ago · 0 ms. Some apps block browser checks, so this may be inaccurate." [ref=e101]: Offline
            - paragraph: Self-hosted photo and video management
            - generic:
              - heading "Immich" [level=3]
            - generic:
              - generic: immich.zoymelvin.my.id
              - generic [ref=e104]:
                - button "Copy" [ref=e105]
                - button "Open in new tab" [ref=e109]
                - button "Edit" [ref=e114]
        - 'button "Vaultwarden, Self-hosted password manager, status: Offline" [ref=e120]':
          - button "Open Vaultwarden" [ref=e121] [cursor=pointer]
          - generic:
            - generic:
              - generic:
                - generic:
                  - img "Vaultwarden"
              - generic "Checked from this device 1s ago · 0 ms. Some apps block browser checks, so this may be inaccurate." [ref=e123]: Offline
            - paragraph: Self-hosted password manager
            - generic:
              - heading "Vaultwarden" [level=3]
            - generic:
              - generic: vault.zoymelvin.my.id
              - generic [ref=e126]:
                - button "Copy" [ref=e127]
                - button "Open in new tab" [ref=e131]
                - button "Edit" [ref=e136]
        - 'button "Server (Cockpit), Web-based Linux server administration, status: Offline" [ref=e142]':
          - button "Open Server (Cockpit)" [ref=e143] [cursor=pointer]
          - generic:
            - generic:
              - generic:
                - generic:
                  - img "Server (Cockpit)"
              - generic "Checked from this device 1s ago · 0 ms. Some apps block browser checks, so this may be inaccurate." [ref=e145]: Offline
            - paragraph: Web-based Linux server administration
            - generic:
              - heading "Server (Cockpit)" [level=3]
            - generic:
              - generic: server.zoymelvin.my.id
              - generic [ref=e148]:
                - button "Copy" [ref=e149]
                - button "Open in new tab" [ref=e153]
                - button "Edit" [ref=e158]
        - 'button "Filebrowser, Web-based file manager, status: Offline" [ref=e164]':
          - button "Open Filebrowser" [ref=e165] [cursor=pointer]
          - generic:
            - generic:
              - generic:
                - generic:
                  - img "Filebrowser"
              - generic "Checked from this device 1s ago · 0 ms. Some apps block browser checks, so this may be inaccurate." [ref=e167]: Offline
            - paragraph: Web-based file manager
            - generic:
              - heading "Filebrowser" [level=3]
            - generic:
              - generic: filebrowser.zoymelvin.my.id
              - generic [ref=e170]:
                - button "Copy" [ref=e171]
                - button "Open in new tab" [ref=e175]
                - button "Edit" [ref=e180]
        - button "Add app" [ref=e185]
  - button "Open Next.js Dev Tools" [ref=e193] [cursor=pointer]
  - alert [ref=e197]: Good afternoon
```

# Test source

```ts
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
  79  |     await expect(page.locator("h1")).toHaveCount(1);
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
> 106 |     await expect(h1).toHaveText(/^Good (morning|afternoon|evening)$/);
      |                      ^ Error: expect(locator).toHaveText(expected) failed
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
  180 |     await page.reload();
  181 |     await page.waitForTimeout(500);
  182 | 
  183 |     const notes = await page.evaluate(() => {
  184 |       const raw = localStorage.getItem("vindeck_notes_v2");
  185 |       return raw ? JSON.parse(raw) : [];
  186 |     });
  187 | 
  188 |     const quickNotes = notes.filter(
  189 |       (n: { title: string }) => n.title === "Quick note (imported)"
  190 |     );
  191 |     expect(quickNotes.length).toBe(1);
  192 |   });
  193 | });
  194 | 
  195 | test.describe("R12 Grid desktop", () => {
  196 |   test("1920x1080: 4 columns, no left border accent", async ({ page }) => {
  197 |     await login(page);
  198 |     await page.setViewportSize({ width: 1920, height: 1080 });
  199 |     await page.waitForTimeout(500);
  200 | 
  201 |     const grid = page.locator("main section:last-child").first();
  202 |     if ((await grid.count()) > 0) {
  203 |       const cols = await grid.evaluate((el) => {
  204 |         const style = window.getComputedStyle(el);
  205 |         return style.gridTemplateColumns.split(" ").length;
  206 |       });
```