import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <div className="eyebrow">NAVBEA WORKFORCE</div>
      <h1>Sayfa bulunamadı.</h1>
      <p>Aradığınız sayfa bulunamadı. İşlerinize genel bakıştan devam edebilirsiniz.</p>
      <Link className="btn btn-primary" href="/yonetici">
        Genel bakışa dön
      </Link>
    </main>
  );
}
