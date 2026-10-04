# Google Maps

Google Maps uydu görünümü kullanılır. `src/lib/site-blocks.ts` içindeki A, B ve C blok koordinatları kurmacadır; haritada “Örnek bloklar” olarak belirtilir. Bunlar gerçek şantiye sınırları veya çalışan konumu değildir. Gerçek entegrasyonda bu koordinatlar şantiyenin ölçülmüş blok konumlarıyla değiştirilmelidir.

Varsayılan görünüm Google'ın herkese açık uydu gömmesini kullanır. Blok işaretçisine veya alttaki blok düğmesine tıklamak haritayı o konuma merkezler ve yakınlaştırır. Tümü ve yakınlık kontrolleri de vardır. İşaretçiler kamera koordinatlarına göre Web Mercator ile yerleştirilir. Kamera uygulama tarafından yönetilir; iframe'in doğrudan sürüklenmesi devre dışıdır. Böylece örnek işaretçiler görüntüyle birlikte doğru konumda kalır. Google Maps'te aç bağlantısı tam etkileşimli haritayı yeni sekmede açar.

Resmi Maps Embed API için `.env.example` dosyasını `.env.local` olarak kopyalayın, `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` değerini girin ve sunucuyu yeniden başlatın. Google Cloud projesinde Maps Embed API etkin olmalı; tarayıcı anahtarı uygulamanın alan adlarına kısıtlanmalıdır. Anahtar varsa bileşen resmi `/maps/embed/v1/view` adresini ve `maptype=satellite` parametresini kullanır.

Kaynak: [Google Maps Embed API belgeleri](https://developers.google.com/maps/documentation/embed/embedding-map).

Uçtan uca düzen ve iş akışı testlerinde Google ağ isteği engellenir; dış servisin erişilebilirliği bu testlerin sonucu değildir. Canlı harita ayrıca ağ erişimi olan tarayıcıda kontrol edilir.
