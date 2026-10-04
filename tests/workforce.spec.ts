import { expect, test, type Page } from "@playwright/test";

test("eski demo kaydı ekip tanımları eklenirken görevleri korur", async ({ page }) => {
  await ready(page, "/yonetici/gorevler");
  await page.getByRole("button", { name: "Yeni görev", exact: true }).click();
  await page.getByLabel("Görev adı", { exact: true }).fill("Eski kayıt görevi");
  await page.getByLabel("Hedef miktar").fill("20");
  await page.getByRole("button", { name: "Görevi ata", exact: true }).click();
  const count = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("navbea-workforce-demo-v1")!);
    delete state.teams;
    localStorage.setItem("navbea-workforce-demo-v1", JSON.stringify(state));
    return state.tasks.length;
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "Eski kayıt görevi, detayları aç" })).toBeVisible();
  await page.getByRole("button", { name: "Yeni görev", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Ekip", exact: true })).toHaveText("Duvar ekibi");
  await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await ready(page, "/formen/ekip");
  await page.getByRole("button", { name: "Ekipleri düzenle", exact: true }).click();
  await page.getByRole("button", { name: "Ekibi kaydet", exact: true }).click();
  const migrated = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("navbea-workforce-demo-v1")!),
  );
  expect(migrated.tasks).toHaveLength(count);
  expect(migrated.teams).toHaveLength(5);
});

test("formen ekipleri düzenler; görev atamaları korunur ve yönetici güncel ekibi görür", async ({
  page,
}) => {
  await ready(page, "/formen/ekip");
  await page.getByRole("button", { name: "Ekipleri düzenle", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox", { name: "Düzenlenecek ekip" }).click();
  await expect(page.getByRole("option")).toHaveCount(2);
  await page.getByRole("option", { name: "Duvar ekibi", exact: true }).click();
  await dialog.getByLabel("Ekip adı", { exact: true }).fill("Duvar ekibi 1");
  await dialog.getByRole("checkbox", { name: "Hasan Arslan ekip üyesi", exact: true }).uncheck();
  await dialog.getByRole("button", { name: "Ekibi kaydet", exact: true }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("navbea-workforce-demo-v1")!),
  );
  expect(saved.teams.find((team: { id: string }) => team.id === "duvar").workerIds).not.toContain(
    "w4",
  );
  expect(
    saved.tasks.find((task: { title: string }) => task.title === "B Blok duvar örme").workerIds,
  ).toContain("w4");
  await page.reload();
  await page.getByRole("button", { name: "Ekipleri düzenle", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Hasan Arslan ekip üyesi", exact: true }),
  ).not.toBeChecked();
  await expect(page.getByLabel("Ekip adı", { exact: true })).toHaveValue("Duvar ekibi 1");
  await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await ready(page, "/formen/gorevler");
  await page.getByRole("button", { name: "C Blok bölme duvarları, detayları aç" }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByText("Görevde ekip dışındaki çalışanlar var. Çalışan seçimini güncelleyin."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "İşe başla", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Kapat", exact: true }).click();
  await ready(page, "/yonetici/gorevler");
  await expect(page.getByRole("button", { name: "Ekipleri düzenle" })).toHaveCount(0);
  await page.getByRole("button", { name: "Yeni görev", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Ekip", exact: true })).toHaveText(
    "Duvar ekibi 1",
  );
});

test("uydu haritasında blok seçimi harita merkezini değiştirir", async ({ page }) => {
  await ready(page, "/yonetici");
  await page.getByRole("button", { name: "Saha", exact: true }).click();
  const map = page.locator(".satellite-map");
  const iframe = map.locator("iframe");
  const initial = await iframe.getAttribute("src");
  expect(initial).toMatch(/t=k|maptype=satellite/);
  await map.getByRole("button", { name: "A Blok konumuna git", exact: true }).click();
  await expect(iframe).not.toHaveAttribute("src", initial!);
  await expect(map.getByRole("button", { name: "A Blok", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const first = await iframe.getAttribute("src");
  await map.getByRole("button", { name: "B Blok", exact: true }).click();
  await expect(iframe).not.toHaveAttribute("src", first!);
  await expect(map.getByRole("button", { name: "B Blok konumuna git" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await map.getByRole("button", { name: "Tüm blokları göster" }).click();
  await expect(iframe).toHaveAttribute("src", initial!);
  await ready(page, "/formen");
  await page.getByRole("combobox", { name: "Görev", exact: true }).click();
  await page.getByRole("option", { name: "C Blok bölme duvarları", exact: true }).click();
  await expect(
    page.locator(".satellite-map").getByRole("button", { name: "C Blok", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test.beforeEach(async ({ page }) => {
  // Layout and workflow tests remain independent of Google's network availability.
  await page.route("**://*.google.com/**", (route) => route.abort());
});

test("şantiye seçimi yöneticiye ait, görevler proje bazında ayrılır", async ({ page }) => {
  await page.goto("/giris");
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await ready(page, "/yonetici/gorevler");
  await expect(page.getByRole("button", { name: "B Blok duvar örme, detayları aç" })).toBeVisible();
  await page.getByRole("button", { name: "Şantiye değiştir", exact: true }).click();
  await page.getByRole("button", { name: /Sahil Yolu Projesi/ }).click();
  await expect(page.getByRole("button", { name: "Yeni görev", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "B Blok duvar örme, detayları aç" })).toHaveCount(
    0,
  );
  await page.reload();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Şantiye değiştir" })).toContainText(
    "Sahil Yolu Projesi",
  );
  await page.getByRole("button", { name: "Şantiye değiştir", exact: true }).click();
  await page.getByRole("button", { name: /Merkez Şantiye/ }).click();
  await expect(page.getByRole("button", { name: "B Blok duvar örme, detayları aç" })).toBeVisible();
  await ready(page, "/formen");
  await expect(page.getByRole("button", { name: "Şantiye değiştir" })).toHaveCount(0);
  await expect(page.locator('iframe[title="Merkez Şantiye Google Maps"]')).toHaveAttribute(
    "src",
    /google\.com\/maps/,
  );
});

test("temalı seçim klavye, Escape, dış tıklama ve form kaydıyla çalışır", async ({ page }) => {
  await ready(page, "/yonetici/gorevler");
  await page.getByRole("button", { name: "Yeni görev", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const team = dialog.getByRole("combobox", { name: "Ekip", exact: true });
  await team.focus();
  await team.press("ArrowDown");
  await team.press("ArrowDown");
  await team.press("Enter");
  await expect(team).toHaveText("Sıva ekibi");
  await team.click();
  await team.press("Escape");
  await expect(team).toHaveAttribute("aria-expanded", "false");
  await expect(dialog).toBeVisible();
  await team.click();
  await team.press("e");
  await team.press("Enter");
  await expect(team).toHaveText("Elektrik ekibi");
  await team.click();
  await page.getByRole("option", { name: "Sıva ekibi", exact: true }).click();
  await team.click();
  await dialog.getByLabel("Görev adı", { exact: true }).click();
  await expect(team).toHaveAttribute("aria-expanded", "false");
  await dialog.getByLabel("Görev adı", { exact: true }).fill("Temalı seçim testi");
  await dialog.getByLabel("Hedef miktar").fill("40");
  await dialog.getByRole("button", { name: "Görevi ata", exact: true }).click();
  const task = await page.evaluate(
    () => JSON.parse(localStorage.getItem("navbea-workforce-demo-v1")!).tasks[0],
  );
  expect(task.teamId).toBe("siva");
  expect(task.unit).toBe("m²");
  expect(task.siteId).toBe("merkez");
});

test("giriş, hesap rotası, yenileme ve çıkış", async ({ page }) => {
  await page.goto("/yonetici");
  await expect(page).toHaveURL(/\/giris$/);
  await page.getByLabel("E-posta", { exact: true }).fill("selin@navbea.test");
  await page.locator('input[autocomplete="current-password"]').fill("yanlis");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "E-posta veya şifre hatalı." }),
  ).toBeVisible();
  await page.getByLabel("E-posta", { exact: true }).fill("mehmet@navbea.test");
  await page.locator('input[autocomplete="current-password"]').fill("navbea2026");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page).toHaveURL(/\/formen$/);
  await expect(page.locator("h1")).toHaveText("Görev özeti");
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Görev özeti");
  await page.goto("/yonetici/gorevler");
  await expect(page).toHaveURL(/\/formen$/);
  await page.goto("/formen/gorevler");
  await expect(page.getByRole("button", { name: "B Blok duvar örme, detayları aç" })).toHaveCount(
    0,
  );
  await expect(page.locator("h1")).toHaveText("İşlerim");
  await page.getByRole("button", { name: "Çıkış yap", exact: true }).click();
  await expect(page).toHaveURL(/\/giris$/);
  await page.goto("/formen");
  await expect(page).toHaveURL(/\/giris$/);
});

const accounts: Record<string, string> = {
  yonetici: "selin@navbea.test",
  formen: "ahmet@navbea.test",
  isci: "emre@navbea.test",
};
async function loginAs(page: Page, role: string) {
  if (await page.getByRole("button", { name: "Çıkış yap", exact: true }).count())
    await page.getByRole("button", { name: "Çıkış yap", exact: true }).click();
  else await page.goto("/giris");
  await page.getByLabel("E-posta", { exact: true }).fill(accounts[role]);
  await page.locator('input[autocomplete="current-password"]').fill("navbea2026");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByRole("button", { name: "Çıkış yap", exact: true })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/${role}$`));
}
async function ready(page: Page, path: string) {
  const role = path.split("/")[1];
  const current = await page.evaluate(() => {
    try {
      return localStorage.getItem("navbea-session-v1");
    } catch {
      return null;
    }
  });
  if (current !== ({ yonetici: "m1", formen: "f1", isci: "w1" } as Record<string, string>)[role])
    await loginAs(page, role);
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
                ((node.scrollHeight > node.clientHeight + 2 &&
                  !["auto", "scroll"].includes(getComputedStyle(node).overflowY)) ||
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

test("yönetici ekibi atar, formen çalışanları seçer ve işçi görevi görür", async ({ page }) => {
  await ready(page, "/yonetici/gorevler");
  await page.getByRole("button", { name: "Yeni görev", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("checkbox")).toHaveCount(0);
  await dialog.getByLabel("Görev adı", { exact: true }).fill("Test duvar görevi");
  await dialog.getByLabel("Hedef miktar").fill("50");
  await dialog.getByRole("combobox", { name: "Ekip", exact: true }).click();
  await page.getByRole("option", { name: "Duvar ekibi", exact: true }).click();
  await dialog.getByRole("button", { name: "Görevi ata", exact: true }).click();
  const newTask = await page.evaluate(
    () => JSON.parse(localStorage.getItem("navbea-workforce-demo-v1")!).tasks[0],
  );
  expect(newTask.workerIds).toEqual([]);
  expect(newTask.teamId).toBe("duvar");
  await ready(page, "/formen/gorevler");
  await page.getByRole("button", { name: "Test duvar görevi, detayları aç" }).click();
  await expect(page.getByRole("button", { name: "İşe başla", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Görev çalışanlarını belirle" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("checkbox", { name: "Emre Aydın göreve seç", exact: true }).check();
  await dialog.getByRole("button", { name: "Çalışanları kaydet", exact: true }).click();
  await page.getByRole("button", { name: "Kapat", exact: true }).click();
  await ready(page, "/isci/gorevler");
  await page.getByRole("button", { name: "Test duvar görevi, detayları aç" }).click();
  await page.getByRole("button", { name: "Görevi gördüm, anladım", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Test duvar görevi, detayları aç" }).click();
  await expect(page.getByRole("button", { name: "Görevi gördüm", exact: true })).toBeDisabled();
});

test("formen engel ve üretim bildirir, yönetici düzeltme ister ve onaylar", async ({ page }) => {
  await ready(page, "/formen/gorevler");
  await page.getByRole("button", { name: "B Blok duvar örme, detayları aç" }).click();
  await page.getByRole("button", { name: "Engel bildir", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Açıklama", { exact: true }).fill("Tuğla teslimatı bekleniyor.");
  await dialog.getByRole("button", { name: "Engeli bildir", exact: true }).click();
  await ready(page, "/yonetici");
  await expect(page.getByText("Tuğla teslimatı bekleniyor.")).toBeVisible();
  await ready(page, "/formen/gorevler");
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
  await ready(page, "/yonetici/onaylar");
  const card = page.locator(".approval-card").filter({ hasText: "B Blok duvar örme" });
  await card.getByRole("button", { name: "Kaydı incele" }).click();
  dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "Düzeltmeye gönder", exact: true }),
  ).toBeDisabled();
  await dialog.getByLabel("Düzeltme gerekçesi").fill("Ölçümü kontrol edin.");
  await dialog.getByRole("button", { name: "Düzeltmeye gönder", exact: true }).click();
  await dialog.getByRole("button", { name: "Kapat", exact: true }).click();
  await ready(page, "/formen/gorevler");
  await page.getByRole("button", { name: "B Blok duvar örme, detayları aç" }).click();
  await expect(page.getByText("Ölçümü kontrol edin.")).toBeVisible();
  await page.getByRole("button", { name: "Üretim / gün sonu gir" }).click();
  await page.getByRole("dialog").getByLabel("Bugün gerçekleşen üretim").fill("175");
  await page.getByRole("button", { name: "Onaya gönder", exact: true }).click();
  await ready(page, "/yonetici/onaylar");
  await page
    .locator(".approval-card")
    .filter({ hasText: "B Blok duvar örme" })
    .getByRole("button", { name: "Kaydı incele" })
    .click();
  await page.getByRole("button", { name: "Kaydı onayla", exact: true }).click();
  await expect(page.getByRole("dialog").getByText("Gün onaylandı", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Kapat", exact: true }).click();
  await ready(page, "/yonetici/raporlar");
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

test("yönlendirme yalnızca bekleyen kişileri taşır, yeni iş formen kontrolüyle başlar", async ({
  page,
}) => {
  await ready(page, "/formen/gorevler");
  await page.getByRole("button", { name: "B Blok duvar örme, detayları aç" }).click();
  await page.getByRole("button", { name: "Engel bildir", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Açıklama", { exact: true }).fill("İki çalışan malzeme bekliyor.");
  await dialog.getByRole("button", { name: /^Çalışanlar/ }).click();
  await dialog.getByRole("checkbox", { name: "Murat Şahin seç" }).uncheck();
  await dialog.getByRole("checkbox", { name: "Hasan Arslan seç" }).uncheck();
  await dialog.getByRole("button", { name: "Engeli bildir", exact: true }).click();
  await ready(page, "/yonetici/gorevler");
  await page.getByRole("button", { name: "B Blok duvar örme, detayları aç" }).click();
  await page.getByRole("button", { name: /^Engeller/ }).click();
  await page.getByRole("button", { name: "Hazır işe yönlendir" }).click();
  dialog = page.getByRole("dialog");
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await fits(page, "Yönlendirme hedef adımı");
  }
  await dialog.getByRole("button", { name: "Koşulları kontrol et" }).click();
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await fits(page, "Yönlendirme kontrol adımı");
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(dialog.getByRole("button", { name: "Yönlendirmeyi onayla" })).toBeDisabled();
  for (const checkbox of await dialog.getByRole("checkbox").all()) await checkbox.check();
  await dialog.getByRole("button", { name: "Yönlendirmeyi onayla" }).click();
  const transferred = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("navbea-workforce-demo-v1")!);
    return {
      source: state.tasks.find((t: { id: string }) => t.id === "NV-1042"),
      target: state.tasks.find((t: { id: string }) => t.id === "NV-1047"),
    };
  });
  expect(transferred.source.workerIds).toEqual(["w3", "w4"]);
  expect(transferred.source.actual).toBe(120);
  expect(transferred.source.laborHours).toBe(30);
  expect(transferred.target.workerIds).toEqual(["w1", "w2"]);
  expect(transferred.target.status).toBe("planned");
  await ready(page, "/formen/gorevler");
  await page.getByLabel("Görev ara").fill("C Blok bölme");
  await page.getByRole("button", { name: "C Blok bölme duvarları, detayları aç" }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "İşe başla", exact: true })).toBeDisabled();
  for (const name of ["Malzeme hazır", "Ekipman uygun", "Çalışma alanı güvenli ve hazır"])
    await dialog.getByLabel(name, { exact: true }).check();
  await dialog.getByRole("button", { name: "İşe başla", exact: true }).click();
  await expect(dialog.getByText("Devam ediyor", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Geçmiş", exact: true }).click();
  await expect(dialog.getByText("İş başlangıcı kaydedildi", { exact: true })).toBeVisible();
});

test("hazırlık eksiğini kapatmak planlanmış işi otomatik başlatmaz", async ({ page }) => {
  await ready(page, "/formen/gorevler");
  await page.getByLabel("Görev ara").fill("C Blok bölme");
  await page.getByRole("button", { name: "C Blok bölme duvarları, detayları aç" }).click();
  await page.getByRole("button", { name: "Eksik bildir", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Açıklama", { exact: true })
    .fill("Çalışma alanı hazırlanmadı.");
  await page.getByRole("button", { name: "Engeli bildir", exact: true }).click();
  await page.getByRole("button", { name: "C Blok bölme duvarları, detayları aç" }).click();
  await page.getByRole("button", { name: /^Engeller/ }).click();
  await page.getByRole("button", { name: "Kontrol ettim, giderildi" }).click();
  await expect(page.getByRole("dialog").getByText("Planlandı", { exact: true })).toBeVisible();
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
                  "main, .sidebar, .topbar, .topbar-actions > *, .mobile-nav, main .paged-items, main .panel, main .task-list",
                ),
              );
              const overflow = nodes
                .filter(
                  (node) =>
                    node.getBoundingClientRect().height > 0 &&
                    (node.getBoundingClientRect().right > innerWidth + 1 ||
                      node.getBoundingClientRect().left < -1 ||
                      node.scrollHeight > node.clientHeight + 2 ||
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
    await check("tek ekran görev formu");
    await dialog.getByLabel("Görev adı", { exact: true }).fill("Ekran testi");
    await dialog.getByLabel("Hedef miktar").fill("100");
    await dialog.getByRole("combobox", { name: "Ekip", exact: true }).click();
    await page.getByRole("option", { name: "Duvar ekibi", exact: true }).click();
    await dialog.getByLabel("Görev notu").fill("Tek form testi");
    await check("tek ekran form alt alanları");
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
