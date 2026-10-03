import { expect, test, type Page } from "@playwright/test";

async function ready(page: Page, path: string) {
  await page.goto(path);
  await expect(
    page.getByRole("status").filter({ hasText: "Çalışma alanın hazırlanıyor" }),
  ).toHaveCount(0);
  await expect(page.locator("h1")).toBeVisible();
}

async function fits(page: Page, label: string) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const nodes = Array.from(
            document.querySelectorAll<HTMLElement>(
              "main, .sidebar, .topbar, main .paged-items, main .panel, main .task-list, dialog[open], dialog[open] .modal-content, dialog[open] .form-body, dialog[open] .detail-body, dialog[open] .form-step-content, dialog[open] .detail-tab-content, dialog[open] .paged-items",
            ),
          );
          return nodes
            .filter(
              (node) =>
                node.getBoundingClientRect().height > 0 &&
                (node.scrollHeight > node.clientHeight + 2 ||
                  node.scrollWidth > node.clientWidth + 2),
            )
            .map(
              (node) =>
                `${node.className}: ${node.scrollHeight}/${node.clientHeight},${node.scrollWidth}/${node.clientWidth}`,
            );
        }),
      { message: label, timeout: 5000 },
    )
    .toEqual([]);
}

test("atama üç role yansır, görev okundu bilgisi saklanır", async ({ page }) => {
  await ready(page, "/yonetici/gorevler");
  await page.getByRole("button", { name: "Yeni görev", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Görev adı", { exact: true }).fill("Test duvar görevi");
  await dialog.getByLabel("Hedef miktar").fill("50");
  await dialog.getByRole("button", { name: "Devam", exact: true }).click();
  await dialog.getByRole("checkbox", { name: "Emre Aydın seç", exact: true }).check();
  await dialog.getByRole("button", { name: "Devam", exact: true }).click();
  await dialog.getByRole("button", { name: "Görevi ata", exact: true }).click();
  await expect(page.getByRole("button", { name: "Test duvar görevi, detayları aç" })).toBeVisible();
  await page.getByLabel("Rol değiştir").selectOption("formen");
  await page.goto("/formen/gorevler");
  await expect(page.getByRole("button", { name: "Test duvar görevi, detayları aç" })).toBeVisible();
  await page.getByLabel("Rol değiştir").selectOption("isci");
  await expect(
    page.getByRole("button", { name: "Görevi gördüm, anladım", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Görevi gördüm, anladım", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Görevi gördüm", exact: true })).toBeDisabled();
  await page.goto("/isci/gorevler");
  await expect(page.getByRole("button", { name: "Test duvar görevi, detayları aç" })).toBeVisible();
});

test("formen engel ve üretim bildirir, yönetici düzeltme ister ve onaylar", async ({ page }) => {
  await ready(page, "/formen/gorevler");
  await page.getByRole("button", { name: "B Blok duvar örme, detayları aç" }).click();
  await page.getByRole("button", { name: "Engel bildir", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Açıklama", { exact: true }).fill("Tuğla teslimatı bekleniyor.");
  await dialog.getByRole("button", { name: "Engeli bildir", exact: true }).click();
  await page.goto("/yonetici");
  await expect(page.getByText("Tuğla teslimatı bekleniyor.")).toBeVisible();
  await page.goto("/formen/gorevler");
  await page.getByRole("button", { name: "B Blok duvar örme, detayları aç" }).click();
  await page.getByRole("button", { name: /^Engeller/ }).click();
  await page.getByRole("button", { name: "Kontrol ettim, giderildi" }).click();
  await page.getByRole("button", { name: "Üretim / gün sonu gir" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Bugün gerçekleşen üretim").fill("180");
  await dialog.getByLabel("Toplam işçi-saat").fill("30");
  await dialog.getByLabel("İçindeki bekleme saati").fill("31");
  await dialog.getByRole("button", { name: "Onaya gönder", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Bekleme süresi toplam işçi-saatten fazla olamaz",
  );
  await dialog.getByLabel("İçindeki bekleme saati").fill("3");
  await dialog.getByRole("button", { name: "Onaya gönder", exact: true }).click();
  await page.goto("/yonetici/onaylar");
  const card = page.locator(".approval-card").filter({ hasText: "B Blok duvar örme" });
  await card.getByRole("button", { name: "Kaydı incele" }).click();
  dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "Düzeltmeye gönder", exact: true }),
  ).toBeDisabled();
  await dialog.getByLabel("Düzeltme gerekçesi").fill("Ölçümü kontrol edin.");
  await dialog.getByRole("button", { name: "Düzeltmeye gönder", exact: true }).click();
  await dialog.getByRole("button", { name: "Kapat", exact: true }).click();
  await page.goto("/formen/gorevler");
  await page.getByRole("button", { name: "B Blok duvar örme, detayları aç" }).click();
  await expect(page.getByText("Ölçümü kontrol edin.")).toBeVisible();
  await page.getByRole("button", { name: "Üretim / gün sonu gir" }).click();
  await page.getByRole("dialog").getByLabel("Bugün gerçekleşen üretim").fill("175");
  await page.getByRole("button", { name: "Onaya gönder", exact: true }).click();
  await page.goto("/yonetici/onaylar");
  await page
    .locator(".approval-card")
    .filter({ hasText: "B Blok duvar örme" })
    .getByRole("button", { name: "Kaydı incele" })
    .click();
  await page.getByRole("button", { name: "Kaydı onayla", exact: true }).click();
  await expect(page.getByRole("dialog").getByText("Tamamlandı", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Kapat", exact: true }).click();
  await page.goto("/yonetici/raporlar");
  await page.getByLabel("Yalnızca onaylı kayıtlar").check();
  await expect(page.locator(".report-record")).toHaveCount(1);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV indir" }).click();
  expect((await download).suggestedFilename()).toBe("navbea-30-eylul-2026.csv");
});

test("hazırlık ve çakışma kontrolü aynı ekibin iki işte başlamasını önler", async ({ page }) => {
  await ready(page, "/formen/gorevler");
  await page.getByLabel("Görev ara").fill("C Blok bölme");
  await page.getByRole("button", { name: "C Blok bölme duvarları, detayları aç" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Malzeme hazır", { exact: true }).check();
  await dialog.getByLabel("Ekipman uygun", { exact: true }).check();
  await dialog.getByLabel("Çalışma alanı güvenli ve hazır", { exact: true }).check();
  await expect(dialog.getByRole("button", { name: "İşe başla", exact: true })).toBeDisabled();
  await expect(
    dialog.getByText("Bu ekipte başka bir işte çalışan kişiler var.", { exact: false }),
  ).toBeVisible();
});

test("tüm ekranlar viewport içine sığar, içerik kırpılmaz ve tema saklanır", async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const routes = [
    "/yonetici",
    "/yonetici/gorevler",
    "/yonetici/ekip",
    "/yonetici/onaylar",
    "/yonetici/raporlar",
    "/yonetici/profil",
    "/yonetici/bildirimler",
    "/formen",
    "/formen/gorevler",
    "/formen/ekip",
    "/formen/raporlar",
    "/formen/profil",
    "/formen/bildirimler",
    "/isci",
    "/isci/gorevler",
    "/isci/profil",
    "/isci/bildirimler",
  ];
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await ready(page, route);
      if (["/yonetici", "/formen", "/isci"].includes(route))
        await page.screenshot({
          path: `tmp/${route.slice(1)}-${viewport.width}x${viewport.height}.png`,
          animations: "disabled",
        });
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const nodes = Array.from(
                document.querySelectorAll<HTMLElement>(
                  "main, .sidebar, .topbar, main .paged-items, main .panel, main .task-list",
                ),
              );
              const overflow = nodes
                .filter(
                  (node) =>
                    node.getBoundingClientRect().height > 0 &&
                    (node.scrollHeight > node.clientHeight + 2 ||
                      node.scrollWidth > node.clientWidth + 2),
                )
                .map(
                  (node) =>
                    `${node.tagName}.${node.className}: ${node.scrollHeight}/${node.clientHeight},${node.scrollWidth}/${node.clientWidth}`,
                );
              if (
                document.documentElement.scrollHeight > innerHeight + 1 ||
                document.documentElement.scrollWidth > innerWidth + 1
              )
                overflow.push("document");
              return overflow;
            }),
          { message: `${viewport.width}x${viewport.height} ${route}`, timeout: 5000 },
        )
        .toEqual([]);
    }
  }
  await page.getByRole("button", { name: "Açık veya koyu temayı değiştir" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page, "/isci");
  await page.screenshot({ path: "tmp/worker-mobile-dark.png", animations: "disabled" });
  await page.getByRole("button", { name: "Açık veya koyu temayı değiştir" }).click();
  await page.screenshot({ path: "tmp/worker-mobile-light.png", animations: "disabled" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page, "/yonetici");
  await page.screenshot({ path: "tmp/manager-desktop-light.png", animations: "disabled" });
  await page.getByRole("button", { name: "Açık veya koyu temayı değiştir" }).click();
  await page.screenshot({ path: "tmp/manager-desktop-dark.png", animations: "disabled" });
  expect(errors).toEqual([]);
});

test("mobil sekmeler, sayfalama ve tüm form adımları ekrana sığar", async ({ page }) => {
  test.setTimeout(180_000);
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
    { width: 1366, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    const check = (label: string) => fits(page, `${viewport.width}x${viewport.height} ${label}`);
    await ready(page, "/yonetici");
    await page.getByRole("button", { name: "Saha", exact: true }).click();
    await check("saha");
    await page.getByRole("button", { name: /^Görevler/ }).click();
    await check("görev sekmesi");
    await ready(page, "/yonetici/ekip");
    const names = new Set<string>();
    do {
      for (const name of await page.locator(".person-card h2").allTextContents()) names.add(name);
      const next = page.getByRole("button", { name: "Sonraki sayfa", exact: true });
      if (await next.isDisabled()) break;
      await next.click();
    } while (names.size < 12);
    expect(names.size).toBe(12);
    await ready(page, "/yonetici/raporlar");
    await page.getByRole("button", { name: "Haftalık dağılım", exact: true }).click();
    await check("grafik");
    await ready(page, "/isci/profil");
    await page.getByRole("button", { name: "Tercihler", exact: true }).click();
    await page.getByRole("button", { name: "Örnek verileri sıfırla", exact: true }).click();
    await check("sıfırlama tercihi");
    await ready(page, "/isci");
    await page.getByRole("button", { name: "Alan", exact: true }).click();
    await check("işçi çalışma alanı");
    await ready(page, "/yonetici/gorevler");
    await page.getByRole("button", { name: "Yeni görev", exact: true }).click();
    let dialog = page.getByRole("dialog");
    await check("yeni görev iş adımı");
    await dialog.getByLabel("Görev adı", { exact: true }).fill("Ekran testi");
    await dialog.getByLabel("Hedef miktar").fill("100");
    await dialog.getByRole("button", { name: "Devam", exact: true }).click();
    await check("yeni görev ekip adımı");
    await dialog.getByRole("checkbox", { name: "Emre Aydın seç", exact: true }).check();
    await dialog.getByRole("button", { name: "Devam", exact: true }).click();
    await check("yeni görev plan adımı");
    await dialog.getByRole("button", { name: "Pencereyi kapat" }).click();
    await ready(page, "/yonetici/onaylar");
    await page.getByRole("button", { name: "Kaydı incele" }).click();
    await check("onay detayı");
    await page.getByRole("dialog").getByRole("button", { name: "Kapat", exact: true }).click();
    await ready(page, "/formen/gorevler");
    await page.getByLabel("Görev ara").fill("C Blok bölme");
    await page.getByRole("button", { name: "C Blok bölme duvarları, detayları aç" }).click();
    await check("hazırlık detayı");
    dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /^Ekip/ }).click();
    await check("görev ekibi");
    await dialog.getByRole("button", { name: "Kapat", exact: true }).click();
    await page.getByLabel("Görev ara").fill("iç cephe sıva");
    await page.getByRole("button", { name: "A Blok iç cephe sıva, detayları aç" }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /^Engeller/ }).click();
    await check("engel detayı");
    await dialog.getByRole("button", { name: "Üretim / gün sonu gir", exact: true }).click();
    await check("engelli üretim formu");
    await page.getByRole("dialog").getByRole("button", { name: "Pencereyi kapat" }).click();
    await page.getByLabel("Görev ara").fill("B Blok duvar");
    await page.getByRole("button", { name: "B Blok duvar örme, detayları aç" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Engel bildir", exact: true })
      .click();
    await check("engel bildirim formu");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^Çalışanlar/ })
      .click();
    await check("engel çalışan seçimi");
    await page.getByRole("dialog").getByRole("button", { name: "Pencereyi kapat" }).click();
  }
});
