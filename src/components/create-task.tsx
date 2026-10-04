"use client";
import { Select } from "./select";
import { useState, type FormEvent } from "react";
import { useDemo } from "@/lib/demo-store";
import { person } from "@/lib/demo-data";
import { zones } from "@/lib/teams";
import { useSite } from "@/lib/sites";
import { Icon, Modal } from "./ui";

export function CreateTask({
  onClose,
  onToast,
}: {
  onClose: () => void;
  onToast: (message: string) => void;
}) {
  const { addTask, state } = useDemo();
  const teams = state.teams;
  const { site } = useSite();
  const [teamId, setTeamId] = useState(teams[0].id);
  const [error, setError] = useState("");
  const team = teams.find((t) => t.id === teamId)!;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!site.teamIds.includes(teamId)) {
      setError("Bu şantiyede seçilen ekip tanımlı değil.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") || "").trim();
    const start = String(data.get("start"));
    const end = String(data.get("end"));
    const target = Number(data.get("target"));
    if (!title || !Number.isFinite(target) || target <= 0) {
      setError("Görev adı ve hedef miktarı gerekli.");
      return;
    }
    if (end <= start) {
      setError("Bitiş saati başlangıçtan sonra olmalı.");
      return;
    }
    addTask({
      id: `NV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      title,
      zone: String(data.get("zone")),
      trade: team.trade,
      teamId,
      siteId: site.id,
      foremanId: team.foremanId,
      workerIds: [],
      target,
      actual: 0,
      unit: String(data.get("unit")),
      start,
      end,
      status: "planned",
      priority: data.get("priority") === "high" ? "high" : "normal",
      note: String(data.get("note") || "").trim(),
      ready: false,
      laborHours: 0,
      waitingHours: 0,
    });
    onToast("Görev ekibe atandı. Çalışanları formen belirleyecek.");
    onClose();
  }
  return (
    <Modal title="Yeni görev" subtitle={site.name} onClose={onClose} wide>
      <form className="modal-form create-task-form" onSubmit={submit}>
        <div className="form-body single-task-body">
          <div className="form-grid single-task-grid">
            <label className="field field-full">
              Görev adı
              <input
                name="title"
                required
                maxLength={80}
                autoFocus
                placeholder="Örn. B Blok duvar örme"
              />
            </label>
            <label className="field">
              Çalışma bölgesi
              <Select aria-label="Çalışma bölgesi" name="zone" defaultValue={zones[0]}>
                {zones.map((zone) => (
                  <option key={zone}>{zone}</option>
                ))}
              </Select>
            </label>
            <label className="field">
              Ekip
              <Select aria-label="Ekip" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                {teams
                  .filter((t) => site.teamIds.includes(t.id))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </Select>
            </label>
            <div className="assigned-team field-full">
              <Icon name="team" size={18} />
              <span>
                <strong>{person(team.foremanId).name}</strong>
                <small>
                  {team.trade} · {team.workerIds.length} kişilik ekip · Görevdeki çalışanları formen
                  seçer
                </small>
              </span>
            </div>
            <label className="field">
              Hedef miktar
              <input
                name="target"
                type="number"
                min="0.1"
                max="1000000"
                step="0.1"
                required
                placeholder="200"
              />
            </label>
            <label className="field">
              Ölçü birimi
              <Select aria-label="Ölçü birimi" name="unit">
                {["m²", "m", "kg", "adet", "m³"].map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </Select>
            </label>
            <label className="field">
              Başlangıç
              <input name="start" type="time" defaultValue="08:00" required />
            </label>
            <label className="field">
              Bitiş
              <input name="end" type="time" defaultValue="17:00" required />
            </label>
            <label className="field">
              Öncelik
              <Select aria-label="Öncelik" name="priority">
                <option value="normal">Normal</option>
                <option value="high">Yüksek</option>
              </Select>
            </label>
            <label className="field">
              Görev notu
              <input name="note" maxLength={300} placeholder="İşin kapsamı veya saha notu" />
            </label>
          </div>
          {error && (
            <p className="form-message" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" className="btn btn-primary">
            <Icon name="plus" size={17} />
            Görevi ata
          </button>
        </div>
      </form>
    </Modal>
  );
}
