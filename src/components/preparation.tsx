import { Icon } from "./ui";
export const readinessChecks = [
  {
    label: "Malzeme hazır",
    description: "İş için gereken malzeme çalışma bölgesinde.",
    icon: "brick",
  },
  {
    label: "Ekipman uygun",
    description: "Ekipman kontrol edildi ve kullanıma hazır.",
    icon: "helmet",
  },
  {
    label: "Çalışma alanı güvenli ve hazır",
    description: "Alan erişimi ve güvenlik koşulları kontrol edildi.",
    icon: "shield",
  },
];
export function ReadinessChecks({
  checks,
  onChange,
}: {
  checks: boolean[];
  onChange: (index: number, checked: boolean) => void;
}) {
  return (
    <div className="readiness-checks">
      {readinessChecks.map((item, i) => (
        <label className={`readiness-card ${checks[i] ? "is-checked" : ""}`} key={item.label}>
          <span className="readiness-icon">
            <Icon name={item.icon} size={20} />
          </span>
          <span>
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </span>
          <input
            type="checkbox"
            aria-label={item.label}
            checked={checks[i]}
            onChange={(e) => onChange(i, e.target.checked)}
          />
        </label>
      ))}
    </div>
  );
}
