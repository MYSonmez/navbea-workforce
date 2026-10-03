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

Her rolde bildirimler ve hesap/tema tercihleri de vardır. Üst menüden rol değiştirilebilir.
Masaüstünde yan menü, mobilde alt menü kullanılır.
Ekranlar cihaz yüksekliğine göre düzenlenir. Uzun listeler, kullanılabilir alana göre
satır sayısını belirleyen sayfalama kullanır. Görev atama formu iş, ekip ve plan olarak
üç adımdır; görev ayrıntıları ve raporlar sekmelerle açılır.

## Çalışan demo akışları

- Yönetici görev oluşturur, bölge/hedef/formen/çalışan atar.
- Formen malzeme, ekipman ve alan hazırlığını kontrol ederek işi başlatır.
- Aktif veya bekleyen bir işte bulunan çalışan ikinci bir işte başlatılamaz.
- Formen yalnızca etkilenen çalışanlar için engel bildirir; giderildiğini doğrulayarak kapatır.
- Formen günlük toplam üretimi ve işçi-saati kaydeder. Miktar eklenmez, gün toplamı değiştirilir.
- Açık engel varken üretim kaydedilebilir; gün sonu onayına gönderilemez.
- Bekleme saati toplam işçi-saatin içinde tutulur; toplamdan fazla olamaz.
- Yönetici gün sonunu onaylar veya gerekçeyle düzeltmeye gönderir.
- İşçi kendisine atanan görevleri ve sorumlu formeni görür, görevi okuduğunu işaretler.
- Raporlar iş bazında verim ve temsili işçilik maliyeti hesaplar; CSV indirilebilir.
- Görev arama, durum filtreleri, çalışan arama, bildirimleri okundu işaretleme ve demo sıfırlama çalışır.

## Klasör yapısı

```text
src/
  app/                         # Next.js sayfaları, layout, tema ve responsive stiller
    [role]/[[...section]]/      # Rol ve bölüm rotaları; geçersiz rotalar 404 döner
  components/
    app-shell.tsx              # Masaüstü/mobil menü, rol ve tema seçimi
    dashboard.tsx              # Yönetici, formen ve işçi ana ekranları
    task-list.tsx              # Görev listesi, arama ve filtreler
    pagination.tsx             # Ekrana göre sayfalama ve bölüm sekmeleri
    task-detail.tsx            # Hazırlık, detay ve yönetici onayı
    forms.tsx                  # Görev atama, engel ve üretim formları
    sections.tsx               # Ekip, rapor, onay, bildirim ve profil ekranları
    site-map.tsx               # Şematik, tıklanabilir saha bölgeleri
    ui.tsx                     # Paylaşılan arayüz bileşenleri
    workspace.tsx              # Ekran ve modal koordinasyonu
  lib/
    types.ts                   # Domain tipleri
    demo-data.ts               # Örnek veri, kullanıcı, menü ve durum tanımları
    demo-store.tsx             # React external store + localStorage adaptörü
tests/                         # Rol akışları, veri saklama ve responsive kontroller
```

## Backend entegrasyonu

Bu proje frontend demosudur. Gerçek oturum, rol yetkilendirmesi, API, RTLS, fotoğraf yükleme,
sunucu onay geçmişi, işçi-saat otomasyonu ve çevrimdışı sunucu senkronizasyonu henüz yoktur.
Rol seçici gerçek giriş değildir; rol bazlı rotalar bir güvenlik sınırı oluşturmaz.

Görev/formen/çalışan verileri aynı örnek şantiyeye aittir. Yönetici Selin Demir, formen Ahmet Yılmaz,
işçi Emre Aydın olarak gösterilir. Mehmet Kaya, yönetici ekranında ikinci örnek formendir.
Şantiye tarihi 30 Eylül 2026 olarak sabittir. Rapor geçmişi açıkça temsili veri olarak etiketlenmiştir.

`demo-store.tsx` içindeki komutları bir API servis katmanına taşıyarak gerçek backend bağlanabilir.
Rol/kullanıcı bilgileri daha sonra bir oturum sağlayıcısından alınmalıdır.
Saha görünümü görev atamalarını gösterir; canlı konum değildir.
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

E2E testler için Microsoft Edge ve 3001 portunda çalışan uygulama gerekir:

```sh
npm run dev -- --port 3001
npm run test:e2e
```

Edge yoksa `playwright.config.ts` içindeki `channel` tercihini değiştirin ve uygun Playwright
tarayıcısını kurun. Testler tarayıcıya özel bağlamlarda çalışır; uygulamadaki demo verilerinizi değiştirmez.

## Tasarım

Mavi vurgular, beyaz kartlar ve açık gri-mavi zemin; durumlara özel amber/mor renkler. Açık ve koyu tema değişkenleri
`src/app/globals.css` içinde tanımlıdır ve Tailwind tema tokenlarına bağlanmıştır.
Yerel sistem fontları kullanılır; harici font veya görsel servis bağımlılığı yoktur.
Saha planı ölçeklenebilir SVG çizimidir. Haritadaki bölgelere basarak görev ayrıntıları açılır.
Native dialog ile klavye odağı ve Escape desteği, görünür odak işaretleri, içerik atlama bağlantısı,
durum bildirimi, azaltılmış hareket tercihi ve mobil güvenli alan desteği vardır.

## Doğrulama notları

TypeScript, ESLint, üretim derlemesi ve beş uçtan uca tarayıcı senaryosu doğrulandı.
Tüm rol sayfaları 1440×900, 1366×768, 390×844, 320×568, 844×390 ve 768×1024
ölçülerinde yatay ve dikey taşma kontrolünden geçti. Sayfalama ile tüm çalışanlara erişim,
alternatif sekmeler, görev atama adımları, engel/üretim formları, hazırlık ve onay pencereleri
de mobil, yatay telefon ve masaüstü ölçülerinde kontrol edildi.

`npm audit --omit=dev` üretim bağımlılıkları için açık raporlamadı. Tam denetimde ESLint'in
`braces` bağımlılık zincirine ait beş yüksek seviye kayıt var; kontrol edilen en güncel `braces`
sürümü de 3.0.3 olduğundan mevcut araç zincirinde uyumlu bir düzeltme bulunamadı.
Önerilen zorunlu düzeltme Next.js ESLint yapılandırmasını eski ana sürüme düşürüyor; uygulanmadı.
