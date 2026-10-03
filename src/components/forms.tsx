"use client";
import { useState, type FormEvent } from "react";
import { people } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import type { Task } from "@/lib/types";
import { Avatar, Icon, Modal } from "./ui";
import { PagedList, Tabs } from "./pagination";

interface FormProps {
  onClose: () => void;
  onToast: (message: string) => void;
}
export function CreateTask({ onClose, onToast }: FormProps) {
  const { addTask } = useDemo();
  const [step, setStep] = useState<"job" | "crew" | "plan">("job");
  const [form, setForm] = useState({
    title: "",
    zone: "B Blok · 2. kat",
    trade: "Duvar işleri",
    target: "",
    unit: "m²",
    foremanId: "f1",
    start: "08:00",
    end: "17:00",
    priority: "normal",
    note: "",
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const update = (key: keyof typeof form, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (step === "job") {
      if (!form.title.trim()) {
        setError("Görev adını yazın.");
        return;
      }
      setStep("crew");
      return;
    }
    if (step === "crew") {
      if (!selected.length) {
        setError("En az bir çalışan seçin.");
        return;
      }
      setStep("plan");
      return;
    }
    if (form.end <= form.start) {
      setError("Bitiş saati başlangıçtan sonra olmalı.");
      return;
    }
    addTask({
      id: `NV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      title: form.title.trim(),
      zone: form.zone,
      trade: form.trade,
      foremanId: form.foremanId,
      workerIds: selected,
      target: Number(form.target),
      actual: 0,
      unit: form.unit,
      start: form.start,
      end: form.end,
      status: "planned",
      priority: form.priority === "high" ? "high" : "normal",
      note: form.note.trim() || "Formen başlangıç koşullarını kontrol eder.",
      ready: false,
      laborHours: 0,
      waitingHours: 0,
    });
    onToast("Görev atandı.");
    onClose();
  }
  return (
    <Modal title="Yeni görev" subtitle="İş, ekip ve çalışma planı" onClose={onClose} wide>
      <form className="modal-form" onSubmit={submit}>
        <div className="form-body">
          <div className="step-indicator">
            {[
              { id: "job", label: "1. İş" },
              { id: "crew", label: "2. Ekip" },
              { id: "plan", label: "3. Plan" },
            ].map((item) => (
              <span key={item.id} className={step === item.id ? "is-active" : ""}>
                {item.label}
              </span>
            ))}
          </div>
          <div className="form-step-content">
            {step === "job" && (
              <div className="form-grid">
                <label className="field field-full">
                  Görev adı
                  <input
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    required
                    maxLength={80}
                    autoFocus
                  />
                </label>
                <label className="field">
                  Bölge
                  <select value={form.zone} onChange={(e) => update("zone", e.target.value)}>
                    {[
                      "B Blok · 2. kat",
                      "B Blok · 1. kat",
                      "A Blok · 1. kat",
                      "A Blok · Zemin",
                      "C Blok · 1. kat",
                      "C Blok · 3. kat",
                    ].map((zone) => (
                      <option key={zone}>{zone}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  İş türü
                  <select value={form.trade} onChange={(e) => update("trade", e.target.value)}>
                    {[
                      "Duvar işleri",
                      "Sıva işleri",
                      "Kalıp işleri",
                      "Demir işleri",
                      "Elektrik işleri",
                    ].map((trade) => (
                      <option key={trade}>{trade}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Hedef miktar
                  <input
                    type="number"
                    min="0.1"
                    max="1000000"
                    step="0.1"
                    value={form.target}
                    onChange={(e) => update("target", e.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  Ölçü birimi
                  <select value={form.unit} onChange={(e) => update("unit", e.target.value)}>
                    {["m²", "m", "kg", "adet", "m³"].map((unit) => (
                      <option key={unit}>{unit}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {step === "crew" && (
              <>
                <label className="field">
                  Sorumlu formen
                  <select
                    value={form.foremanId}
                    onChange={(e) => update("foremanId", e.target.value)}
                  >
                    <option value="f1">Ahmet Yılmaz</option>
                    <option value="f2">Mehmet Kaya</option>
                  </select>
                </label>
                <div className="crew-heading">
                  Çalışanlar<span className="count-chip">{selected.length} seçildi</span>
                </div>
                <PagedList
                  items={people.filter((p) => p.role === "isci")}
                  rowHeight={52}
                  minColumnWidth={245}
                  gap={6}
                  className="crew-grid"
                  label="Çalışan seçimi"
                  renderItem={(p) => (
                    <label
                      key={p.id}
                      className={`crew-option ${selected.includes(p.id) ? "is-selected" : ""}`}
                    >
                      <input
                        aria-label={`${p.name} seç`}
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, p.id]
                              : selected.filter((id) => id !== p.id),
                          )
                        }
                      />
                      <Avatar user={p} small />
                      <span>
                        <strong>{p.name}</strong>
                        <small>{p.trade}</small>
                      </span>
                    </label>
                  )}
                />
              </>
            )}
            {step === "plan" && (
              <>
                <div className="form-grid plan-grid">
                  <label className="field">
                    Başlangıç
                    <input
                      type="time"
                      value={form.start}
                      onChange={(e) => update("start", e.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    Bitiş
                    <input
                      type="time"
                      value={form.end}
                      onChange={(e) => update("end", e.target.value)}
                      required
                    />
                  </label>
                  <label className="field field-full">
                    Öncelik
                    <select
                      value={form.priority}
                      onChange={(e) => update("priority", e.target.value)}
                    >
                      <option value="normal">Normal</option>
                      <option value="high">Yüksek öncelik</option>
                    </select>
                  </label>
                  <label className="field field-full">
                    Açıklama
                    <textarea
                      rows={2}
                      maxLength={300}
                      value={form.note}
                      onChange={(e) => update("note", e.target.value)}
                      placeholder="Görev kapsamı"
                    />
                  </label>
                </div>
                <p className="form-hint">
                  {selected.length} çalışan · {form.target} {form.unit} · Başlangıcı formen
                  kaydeder.
                </p>
              </>
            )}
          </div>
          <div className="form-message" role={error ? "alert" : undefined}>
            {error}
          </div>
        </div>
        <div className="modal-footer">
          {step === "job" ? (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Vazgeç
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setError("");
                setStep(step === "plan" ? "crew" : "job");
              }}
            >
              Geri
            </button>
          )}
          <button type="submit" className="btn btn-primary">
            {step === "plan" ? "Görevi ata" : "Devam"}
            <Icon name={step === "plan" ? "check" : "right"} size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function IssueForm({ task, onClose, onToast }: FormProps & { task: Task }) {
  const { state, addIssue } = useDemo();
  const alreadyWaiting = state.issues
    .filter((i) => i.taskId === task.id && !i.resolved)
    .flatMap((i) => i.workerIds);
  const available = task.workerIds.filter((id) => !alreadyWaiting.includes(id));
  const [tab, setTab] = useState<"issue" | "crew">("issue");
  const [selected, setSelected] = useState<string[]>(available);
  const [reason, setReason] = useState("Malzeme");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected.length) {
      setError("En az bir bekleyen çalışan seçin.");
      setTab("crew");
      return;
    }
    if (!note.trim()) {
      setError("Engeli açıklayın.");
      setTab("issue");
      return;
    }
    addIssue({ taskId: task.id, reason, note: note.trim(), workerIds: selected });
    onToast("Engel yöneticiye bildirildi.");
    onClose();
  }
  return (
    <Modal title="Engel bildir" subtitle={task.title} onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <div className="form-body">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "issue", label: "Engel" },
              { value: "crew", label: "Çalışanlar", count: selected.length },
            ]}
            label="Engel bildirimi bölümü"
          />
          <div className="form-step-content">
            {tab === "issue" ? (
              <>
                <label className="field">
                  Engel nedeni
                  <select value={reason} onChange={(e) => setReason(e.target.value)}>
                    {["Malzeme", "Ekipman", "Çalışma alanı", "İş güvenliği", "Diğer"].map(
                      (value) => (
                        <option key={value}>{value}</option>
                      ),
                    )}
                  </select>
                </label>
                <label className="field">
                  Açıklama
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={300}
                    required
                  />
                </label>
                <p className="form-hint">
                  {selected.length} çalışan etkileniyor. Çalışanlar sekmesinden seçimi değiştirin.
                </p>
              </>
            ) : (
              <PagedList
                items={task.workerIds}
                rowHeight={56}
                label="Etkilenen çalışanlar"
                renderItem={(id) => {
                  const p = people.find((item) => item.id === id)!;
                  return (
                    <label key={id} className="crew-option">
                      <input
                        aria-label={`${p.name} seç`}
                        type="checkbox"
                        disabled={alreadyWaiting.includes(id)}
                        checked={selected.includes(id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked ? [...selected, id] : selected.filter((v) => v !== id),
                          )
                        }
                      />
                      <Avatar user={p} small />
                      <span>
                        <strong>{p.name}</strong>
                        <small>
                          {alreadyWaiting.includes(id) ? "Açık engelde bekliyor" : p.trade}
                        </small>
                      </span>
                    </label>
                  );
                }}
              />
            )}
          </div>
          <div className="form-message" role={error ? "alert" : undefined}>
            {error}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" className="btn btn-primary" disabled={!available.length}>
            Engeli bildir
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ProductionForm({ task, onClose, onToast }: FormProps & { task: Task }) {
  const { state, updateTask } = useDemo();
  const [error, setError] = useState("");
  const hasOpenIssue = state.issues.some((i) => i.taskId === task.id && !i.resolved);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const hours = Number(data.get("laborHours"));
    const waiting = Number(data.get("waitingHours"));
    const actual = Number(data.get("actual"));
    if (waiting > hours) {
      setError("Bekleme süresi toplam işçi-saatten fazla olamaz.");
      return;
    }
    if (actual > 0 && hours === 0) {
      setError("Üretim için toplam işçi-saati girin.");
      return;
    }
    const intent = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
    if (intent === "review" && hasOpenIssue) {
      setError("Önce açık engelleri kapatın.");
      return;
    }
    updateTask(
      task.id,
      {
        actual,
        laborHours: hours,
        waitingHours: waiting,
        ...(intent === "review" ? { status: "review" as const } : {}),
      },
      {
        title: intent === "review" ? "Gün sonu kaydı onaya gönderildi" : "Üretim kaydı güncellendi",
        description: `${task.title} · ${actual} ${task.unit}`,
        kind: "info",
      },
    );
    onToast(intent === "review" ? "Kayıt yönetici onayına gönderildi." : "Üretim güncellendi.");
    onClose();
  }
  return (
    <Modal title="Üretim ve gün sonu" subtitle={task.title} onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <div className="form-body">
          <div className="form-step-content">
            <p className="form-hint production-hint">
              Günlük toplamı girin. Önceki miktar güncellenir.
            </p>
            <label className="field">
              Bugün gerçekleşen üretim ({task.unit})
              <input
                type="number"
                name="actual"
                defaultValue={task.actual}
                min="0"
                max="1000000"
                step="0.1"
                required
              />
            </label>
            <div className="form-grid">
              <label className="field">
                Toplam işçi-saat
                <input
                  name="laborHours"
                  type="number"
                  defaultValue={task.laborHours}
                  min="0"
                  max="10000"
                  step="0.1"
                  required
                />
              </label>
              <label className="field">
                İçindeki bekleme saati
                <input
                  name="waitingHours"
                  type="number"
                  defaultValue={task.waitingHours}
                  min="0"
                  max="10000"
                  step="0.1"
                  required
                />
              </label>
            </div>
            <p className="form-hint">Bekleme saati toplam süreye dahildir.</p>
            {hasOpenIssue && (
              <p className="form-warning">
                Açık engel var. Üretim kaydedilebilir; onaya gönderilemez.
              </p>
            )}
          </div>
          <div className="form-message" role={error ? "alert" : undefined}>
            {error}
          </div>
        </div>
        <div className="modal-footer">
          <button type="submit" value="save" className="btn btn-secondary">
            Üretimi kaydet
          </button>
          <button type="submit" value="review" className="btn btn-primary" disabled={hasOpenIssue}>
            Onaya gönder
          </button>
        </div>
      </form>
    </Modal>
  );
}
