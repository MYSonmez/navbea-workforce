"use client";
import { Select } from "./select";
import { useState, type FormEvent } from "react";
import { useDemo } from "@/lib/demo-store";
import { person } from "@/lib/demo-data";
import type { Issue, Task } from "@/lib/types";
import { Icon, Modal } from "./ui";
import { Tabs } from "./pagination";

export function RedirectForm({
  task,
  issue,
  onClose,
  onToast,
}: {
  task: Task;
  issue: Issue;
  onClose: () => void;
  onToast: (message: string) => void;
}) {
  const { state, redirectIssue } = useDemo();
  const candidates = state.tasks.filter(
    (t) => t.id !== task.id && t.status === "planned" && t.trade === task.trade,
  );
  const [targetId, setTargetId] = useState(candidates[0]?.id || "");
  const [checks, setChecks] = useState([false, false, false]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"target" | "checks">("target");
  const target = candidates.find((t) => t.id === targetId);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (tab === "target" && target) {
      setTab("checks");
      return;
    }
    if (!target || !checks.every(Boolean)) return;
    if (!redirectIssue(issue.id, targetId)) {
      setError("Ekip veya görev durumu değişti. Atamaları yeniden kontrol edin.");
      return;
    }
    onToast("Yönlendirme onaylandı. Formen yeni görevi teslim alacak.");
    onClose();
  }
  return (
    <Modal
      title="Ekibi hazır işe yönlendir"
      subtitle="Yönetici kararı · Formen teslimi"
      onClose={onClose}
    >
      <form className="modal-form redirect-form" data-step={tab} onSubmit={submit}>
        <div className="form-body">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "target", label: "1. Hedef iş" },
              { value: "checks", label: "2. Kontrol ve onay" },
            ]}
            label="Yönlendirme adımı"
          />
          <div className="form-step-content">
            {tab === "target" && (
              <>
                <div className="transfer-source">
                  <Icon name="warning" size={20} />
                  <div>
                    <strong>
                      {issue.workerIds.length} çalışan {issue.reason.toLocaleLowerCase("tr-TR")}{" "}
                      bekliyor
                    </strong>
                    <small>
                      {task.title} · {task.zone}
                    </small>
                  </div>
                </div>
                <label className="field">
                  Hedef görev
                  <Select
                    aria-label="Hedef görev"
                    value={targetId}
                    onChange={(e) => {
                      setTargetId(e.target.value);
                      setChecks([false, false, false]);
                    }}
                    required
                  >
                    <option value="" disabled>
                      Uygun görev seçin
                    </option>
                    {candidates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} · {t.zone}
                      </option>
                    ))}
                  </Select>
                </label>
              </>
            )}
            {target ? (
              <>
                <div className="transfer-target">
                  <Icon name="tasks" size={22} />
                  <div>
                    <strong>{target.title}</strong>
                    <small>
                      {target.zone} · {person(target.foremanId).name}
                    </small>
                  </div>
                </div>
                {tab === "checks" && (
                  <>
                    <div className="transfer-checks">
                      {[
                        "Seçili çalışanların yetkinliği uygun",
                        "Malzeme, ekipman ve çalışma alanı hazır",
                        "Teslim alacak formenle teyit edildi",
                      ].map((label, i) => (
                        <label className="checkbox-row" key={label}>
                          <input
                            type="checkbox"
                            checked={checks[i]}
                            onChange={(e) =>
                              setChecks(
                                checks.map((v, index) => (index === i ? e.target.checked : v)),
                              )
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <p className="form-hint">
                      {issue.workerIds.length} kişi yönlendirilir; kaynak işte{" "}
                      {task.workerIds.filter((id) => !issue.workerIds.includes(id)).length} kişi
                      kalır. Yeni iş, formen hazırlık kontrolüyle başlar. Önceki üretim ve süre
                      kaynak işte korunur.
                    </p>
                  </>
                )}
              </>
            ) : (
              <p className="form-hint">
                Aynı iş türünde planlanmış alternatif yok. İş planından uygun bir görev oluşturun.
              </p>
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
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!target || (tab === "checks" && !checks.every(Boolean))}
          >
            {tab === "target" ? "Koşulları kontrol et" : "Yönlendirmeyi onayla"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
