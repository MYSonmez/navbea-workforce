"use client";
import { Select } from "./select";
import { useState, type FormEvent } from "react";
import { people } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import type { Task } from "@/lib/types";
import { Avatar, Modal } from "./ui";
import { PagedList, Tabs } from "./pagination";

interface FormProps {
  onClose: () => void;
  onToast: (message: string) => void;
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
                  <Select
                    aria-label="Engel nedeni"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    {["Malzeme", "Ekipman", "Çalışma alanı", "İş güvenliği", "Diğer"].map(
                      (value) => (
                        <option key={value}>{value}</option>
                      ),
                    )}
                  </Select>
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
  const [tab, setTab] = useState<"data" | "note">("data");
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
        productionNote: String(data.get("productionNote") || "").trim(),
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
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "data", label: "Üretim ve süre" },
              { value: "note", label: "Açıklama" },
            ]}
            label="Üretim kaydı bölümü"
          />
          <div className="form-step-content">
            <div className="production-data" hidden={tab !== "data"}>
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
            </div>
            <label className="field production-note" hidden={tab !== "note"}>
              Üretim açıklaması
              <textarea
                name="productionNote"
                defaultValue={task.productionNote || ""}
                rows={2}
                maxLength={300}
                placeholder="Ölçüm, eksik kalan iş veya düzeltme notu"
              />
            </label>
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
