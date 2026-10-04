# Navbea Workforce tasarım sistemi

Referanslardaki sakin ve ferah arayüz, çalışan uygulamasına uyarlanmıştır: açık yüzeyler, güçlü lacivert tipografi, yeşil seçili sekmeler ve saha eylemleri. Girişte şantiye fotoğrafı, hazırlık kartında ekipman fotoğrafı kullanılır; Google Maps uydu görüntüsünü gösterir. Ekip başlığında çalışan fotoğrafı kullanılır.

## Ortak görsel dil

- Arka plan soluk gri-yeşil; kartlar beyaz, çerçeveler hafif, gölgeler yumuşak.
- Mavi planlamayı, yeşil seçili bölümü ve sahada çalışmayı, turuncu engeli, mor günlük onay beklemesini gösterir. Her durum ayrıca metinle belirtilir.
- Masaüstünde açık yan menü, mobilde en fazla beş öğeli alt menü kullanılır. Navbea simgesi yerel SVG'dir.
- Başlıklar 25–34 px, masaüstü görev başlıkları 13 px, kart köşeleri 16–20 px. Kısa ekranlarda kompakt düzen ve ekran alanına göre sayfalama kullanılır.
- Yönetici özetinde ekip, aktif işler, engeller ve ortalama görev ilerlemesi görülür. Ortalama, farklı birimlerdeki miktarları toplamaz; her görevin hedefe oranının ortalamasıdır.
- Mobil yönetici genel bakışında müdahale bekleyen engel önceliklidir. Harita Saha sekmesindedir. Formen güncel görevden üretim ve engel eylemine, işçi kendi atamasından alan ve sorumlu formene ulaşır.
- Açık ve koyu temada aynı anlam ve hiyerarşi korunur. İkonlarda erişilebilir ad, görünür klavye odağı, native dialog ve azaltılmış hareket desteği vardır.
- Navbea simgesinin geometrisi kullanıcının verdiği `navbea-icon-dark.svg` dosyasından alınır. Ana, vurgu ve ikincil renkler tema değişkenleriyle belirlenir; kaynak dosya `public/brand/navbea-source.svg` içinde korunur.
- Seçili bölüm dolu yeşil zemin, beyaz yazı ve kalın fontla belirtilir. Tekrarlanan proje, tarih ve rol şeritleri kaldırılmıştır. Mobil özet görev ve hazırlığa ayrılır; uydu haritası Saha sekmesindedir.
- Formen Ekibim ekranından kendi ekiplerinin adını ve üyelerini düzenler. Güncel ekip tanımı yönetici atama formuna yansır; görevlerdeki mevcut çalışan atamaları korunur. Planlanmış görevde ekip dışında kalan biri varsa başlangıç engellenir ve çalışan seçiminin güncellenmesi istenir.

## Rehberle uyumlu günlük akış

1. Yönetici tek formda iş, bölge, hedef ve ekibi seçer. Formen ekip tanımından gelir; görevde çalışacak kişileri formen seçer. Atama tek başına iş başlangıcı değildir.
2. Formen malzeme, ekipman ve alanı kontrol eder. Eksik bildirilebilir; eksik kapatıldığında planlanmış iş otomatik başlamaz. Başlangıç, açık engel ve ekip çakışması yokken kaydedilir.
3. Engel yalnızca seçili çalışanları etkiler. Görevin rozeti “Engel var”dır; tüm ekibin durduğu anlamına gelmez.
4. Mevcut işe dönüş ve başka işe yönlendirme iki alternatif karardır. Yönetici aynı iş türündeki planlanmış hedefi seçer; yetkinlik, saha hazırlığı ve teslim alacak formen teyidini kontrol eder.
5. Yönlendirme yalnızca etkilenen kişileri kaynak işten taşır. Kaynak işte kalan kişiler ve önceki üretim/süre korunur. Hedefte kaynak ekibe ait eski plan seçimi, taşınan kişilerle güncellenir; hedef iş formen hazırlık kontrolünü bekler.
6. Formen günlük toplam üretimi, toplam işçi-saati, toplamın içindeki beklemeyi ve açıklamayı kaydeder. Kayıt güncellenir; önceki miktara eklenmez.
7. Yönetici günlük kaydı onaylar veya gerekçeyle düzeltmeye gönderir. “Gün onaylandı” işin bütününün bittiği anlamına gelmez. İşlem anındaki miktar, süre ve notlar Geçmiş sekmesinde korunur.

## Demo sınırları

Gerçek oturum, RTLS, fotoğraf yükleme, çevrimdışı sunucu kuyruğu ve API senkronizasyonu yoktur. Uydu haritasındaki blok koordinatları örnektir; `site-blocks.ts` içinde tanımlanır. localStorage kaydı ve işlem geçmişi yalnızca bu tarayıcıdaki demoya aittir. İşçilik maliyeti 250 TL/işçi-saat üzerinden temsili hesaplanır. Günlük demo kayıtları 30 Eylül 2026 tarihine aittir; ana ekranlarda tekrar eden tarih metni kullanılmaz.

Tema tokenları ve ortak görsel kurallar `src/app/workforce.css` içinde, temel düzen ve kompakt ekran kuralları `src/app/globals.css` içindedir. Kullanıcının referansları ve saha rehberi tasarım kararlarının kaynağıdır; skill önerileri ürün bağlamına göre değerlendirilir.
