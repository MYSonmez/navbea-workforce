# Navbea Workforce

Türkçe, açık ve koyu temalı, mobil uyumlu saha yönetimi frontend iskeleti.
Next.js App Router, React, TypeScript ve Tailwind CSS kullanır.

## Çalıştırma

Node.js 20.9 veya daha yeni bir sürüm gerekir.

```sh
npm install
npm run dev
```

Varsayılan adres: `http://localhost:3000`. Farklı bir port için:

```sh
npm run dev -- --port 3001
```

## Rol ekranları

| Rol      | Başlangıç   | Ekranlar                                            |
| -------- | ----------- | --------------------------------------------------- |
| Yönetici | `/yonetici` | Genel bakış, iş planı, ekip, onay merkezi, raporlar |
| Formen   | `/formen`   | Genel bakış, işlerim, ekibim, gün sonu              |
| İşçi     | `/isci`     | Bugün, görevlerim, profilim                         |

Her rolde bildirimler ve hesap/tema tercihleri de vardır. Hesap girişi `/giris` ekranındadır; üst menüden çıkış yapılır.
Masaüstünde yan menü, mobilde alt menü kullanılır.
Ekranlar cihaz yüksekliğine göre düzenlenir. Uzun listeler, kullanılabilir alana göre
satır sayısını belirleyen sayfalama kullanır. Görev atama tek formdur; kısa ekranlarda kaydırılır.
Görev ayrıntıları ve raporlar sekmelerle açılır.

Örnek hesaplar: `selin@navbea.test` (yönetici), `ahmet@navbea.test` ve `mehmet@navbea.test` (formen), `emre@navbea.test` (işçi). Ortak demo şifresi: `navbea2026`.

## Çalışan demo akışları

- Yönetici görev oluşturur, bölge ve hedefi belirler, ekibi seçer. Sorumlu formen ekip tanımından gelir.
- Formen planlanmış göreve kendi ekibindeki çalışanları seçer. Çalışan seçimi ve üç hazırlık kontrolü olmadan iş başlatılamaz.
- Formen Ekibim ekranında kendi ekiplerinin adını ve üyelerini düzenler. Değişiklik mevcut görev atamalarını değiştirmez. Ekip dışında kalan çalışanı olan planlanmış görev başlatılamaz; görev çalışanları yeniden seçilir.
- Formen malzeme, ekipman ve alan hazırlığını kontrol ederek işi başlatır.
- Aktif veya bekleyen bir işte bulunan çalışan ikinci bir işte başlatılamaz.
- Formen yalnızca etkilenen çalışanlar için engel bildirir; giderildiğini doğrulayarak kapatır.
- Yönetici engelden etkilenen kişileri aynı iş türündeki planlanmış bir işe yönlendirir. Kaynak işte kalan ekip ve üretim/süre korunur; yeni iş formen hazırlık kontrolünü bekler.
- Planlanmış işte hazırlık eksiği bildirilebilir. Eksiğin giderilmesi tek başına işi başlatmaz.
- Formen günlük toplam üretimi ve işçi-saati kaydeder. Miktar eklenmez, gün toplamı değiştirilir.
- Açık engel varken üretim kaydedilebilir; gün sonu onayına gönderilemez.
- Bekleme saati toplam işçi-saatin içinde tutulur; toplamdan fazla olamaz.
- Yönetici gün sonunu onaylar veya gerekçeyle düzeltmeye gönderir.
- Üretim açıklaması ve işlem anındaki miktar/süreler görev geçmişinde saklanır. Günlük onay “Gün onaylandı” olarak gösterilir; işin tümüyle bittiği anlamına gelmez.
- İşçi kendisine atanan görevleri ve sorumlu formeni görür, görevi okuduğunu işaretler.
- Raporlar iş bazında verim ve temsili işçilik maliyeti hesaplar; CSV indirilebilir.
- Görev arama, durum filtreleri, çalışan arama, bildirimleri okundu işaretleme ve demo sıfırlama çalışır.

## Klasör yapısı

```text
src/
  app/                         # Next.js sayfaları, layout, tema ve responsive stiller
    [role]/[[...section]]/      # Rol ve bölüm rotaları; geçersiz rotalar 404 döner
  components/
    app-shell.tsx              # Masaüstü/mobil menü, çıkış ve tema seçimi
    login.tsx                  # Hesap girişi
    create-task.tsx            # Tek ekran görev atama
    crew-form.tsx              # Formen çalışan seçimi
    preparation.tsx            # Hazırlık kontrol kartları
    dashboard.tsx              # Yönetici, formen ve işçi ana ekranları
    task-list.tsx              # Görev listesi, arama ve filtreler
    pagination.tsx             # Ekrana göre sayfalama ve bölüm sekmeleri
    task-detail.tsx            # Hazırlık, detay ve yönetici onayı
    forms.tsx                  # Engel ve üretim formları
    sections.tsx               # Ekip, rapor, onay, bildirim ve profil ekranları
    site-map.tsx               # Şematik, tıklanabilir saha bölgeleri
    ui.tsx                     # Paylaşılan arayüz bileşenleri
    workspace.tsx              # Ekran ve modal koordinasyonu
  lib/
    types.ts                   # Domain tipleri
    demo-data.ts               # Örnek veri, kullanıcı, menü ve durum tanımları
    demo-store.tsx             # React external store + localStorage adaptörü
    session.tsx                # Demo hesap oturumu
    teams.ts                   # Ekip ilişkileri
    task-rules.ts              # İşe başlama ve görev görünürlük kuralları
tests/                         # Rol akışları, veri saklama ve responsive kontroller
```

## Backend entegrasyonu

Bu proje frontend demosudur. Gerçek oturum, rol yetkilendirmesi, API, RTLS, fotoğraf yükleme,
sunucu onay geçmişi, işçi-saat otomasyonu ve çevrimdışı sunucu senkronizasyonu henüz yoktur.
Giriş örnek hesaplarla tarayıcıda çalışır; gerçek kimlik doğrulama ve sunucu yetkilendirmesi değildir. Oturumsuz ziyaretler girişe, yanlış rol rotası hesabın paneline yönlendirilir. İstemci kontrolleri güvenlik sınırı oluşturmaz.

Görev/formen/çalışan verileri aynı örnek şantiyeye aittir. Yönetici Selin Demir, formen Ahmet Yılmaz,
işçi Emre Aydın olarak gösterilir. Mehmet Kaya, yönetici ekranında ikinci örnek formendir.
Şantiye tarihi 30 Eylül 2026 olarak sabittir. Rapor geçmişi açıkça temsili veri olarak etiketlenmiştir.

`demo-store.tsx` içindeki komutları bir API servis katmanına taşıyarak gerçek backend bağlanabilir.
`session.tsx` gerçek kimlik sağlayıcısına bağlanmalı; rol yetkileri API üzerinde doğrulanmalıdır.
Saha görünümü Google Maps üzerinden örnek şantiye konumunu gösterir; çalışanların canlı konumu değildir. Entegrasyon bilgileri [docs/google-maps.md](docs/google-maps.md) içindedir.
Üretim onayı işe ait günlük kaydı onaylar; projenin toplam tamamlanması anlamına gelmez.

Veriler `navbea-workforce-demo-v1`, tema `navbea-theme` anahtarıyla localStorage'da saklanır.
Aynı tarayıcıda yenileme ve rol geçişlerinde korunur; açık sekmeler storage olaylarıyla güncellenir.
Hesap & tercihler ekranından örnek verileri sıfırlayabilirsiniz. Bildirimler şantiye genelindeki demo akışını gösterir.

## Kontroller

```sh
npm run typecheck
npm run lint
npm run build
npm run format:check
```

E2E testler için Microsoft Edge ve 3000 portunda çalışan uygulama gerekir:

```sh
npm run dev
npm run test:e2e
```

Edge yoksa `playwright.config.ts` içindeki `channel` tercihini değiştirin ve uygun Playwright
tarayıcısını kurun. Testler tarayıcıya özel bağlamlarda çalışır; uygulamadaki demo verilerinizi değiştirmez.
Farklı bir sunucu adresi için `PLAYWRIGHT_BASE_URL` ortam değişkenini tanımlayın.

## Tasarım

Açık yan menü, lacivert tipografi, yeşil seçili sekmeler ve saha eylemleri, gri-yeşil zemin.
İlerleme dairesel göstergeyle özetlenir; engeller turuncu, günlük onay bekleyen kayıtlar mor renkle belirtilir.
Mobil yönetici özetinde müdahale bekleyen engel önceliklidir; harita Saha sekmesinden açılır.
Açık ve koyu tema değişkenleri `src/app/workforce.css` içinde ortak görsel dile uyarlanır ve Tailwind tema tokenlarına bağlanır.
Ortak görsel kurallar `src/app/workforce.css`, giriş ve hazırlık stilleri `src/app/operations.css`, logo ve son düzenlemeler `src/app/refinements.css`, tasarım kararları [docs/design-system.md](docs/design-system.md) içindedir.
Yerel sistem fontları ve yerel fotoğraf dosyaları kullanılır. Google Maps internet erişimi gerektirir.
Saha görünümü Google Maps uydu görüntüsünü kullanır. Örnek A/B/C bloklarına tıklamak haritayı ilgili konuma merkezler; görev bağlantısı ayrıntıları açar. Ayrıntılar [docs/google-maps.md](docs/google-maps.md) içindedir.
Navbea SVG logosu açık ve koyu tema renklerine uyarlanmıştır; kaynak bilgisi [docs/brand.md](docs/brand.md) içindedir.
Formen kendi ekiplerinin adını ve üyelerini Ekip ekranından düzenler. Ekip değişikliği mevcut görev atamalarını korur; yeni üyelik listesine uymayan bekleyen görevlerde çalışan seçimi güncellenmeden iş başlatılamaz.
Açılır seçimler açık/koyu temaya uyumlu ortak `Select` bileşenidir; ok tuşları, Enter, Escape ve harfle arama desteklenir.
Native dialog ile klavye odağı ve Escape desteği, görünür odak işaretleri, içerik atlama bağlantısı,
durum bildirimi, azaltılmış hareket tercihi ve mobil güvenli alan desteği vardır.

## Doğrulama notları

TypeScript, ESLint, üretim derlemesi ve on üç uçtan uca tarayıcı senaryosu için doğrulama komutları yukarıdadır. Google Maps uydu görünümü canlı tarayıcıda ayrıca kontrol edildi.
Tüm rol sayfaları 1440×900, 1366×768, 390×844, 320×568, 844×390 ve 768×1024
ölçülerinde yatay ve dikey taşma kontrolünden geçti. Sayfalama ile tüm çalışanlara erişim,
alternatif sekmeler, tek görev formu, engel/üretim formları, hazırlık ve onay pencereleri
de mobil, yatay telefon ve masaüstü ölçülerinde kontrol edildi.

`npm audit --omit=dev` üretim bağımlılıkları için açık raporlamadı. Tam denetimde ESLint'in
`braces` bağımlılık zincirine ait beş yüksek seviye kayıt var; kontrol edilen en güncel `braces`
sürümü de 3.0.3 olduğundan mevcut araç zincirinde uyumlu bir düzeltme bulunamadı.
Önerilen zorunlu düzeltme Next.js ESLint yapılandırmasını eski ana sürüme düşürüyor; uygulanmadı.

## Şantiye seçimi

Girişte şantiye seçilmez. Yönetici uygulama içindeki şantiye düğmesiyle proje değiştirir; masaüstünde yan menüde, mobilde üst menüdedir. Seçim `navbea-site-v1` anahtarıyla saklanır. Görev ve engeller proje bazında ayrılır; eski kayıtlarda siteId yoksa Merkez Şantiye kabul edilir. Formen ve işçi örnek hesapları Merkez Şantiye üzerindedir. Sahil Yolu ikinci, boş örnek projedir; ekip tanımı olmadığından görev oluşturulmaz. Şantiye/ekip ilişkileri `src/lib/sites.tsx` içindedir.

Bildirimlerin mevcut demo davranışı korundu. Kullanıcıya özel bildirimler backend aşamasına bırakıldı.
