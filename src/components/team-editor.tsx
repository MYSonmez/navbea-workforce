"use client";
import { useState, type FormEvent } from "react";
import { useDemo } from "@/lib/demo-store";
import { useSession } from "@/lib/session";
import { useSite } from "@/lib/sites";
import { teams as seedTeams } from "@/lib/teams";
import { person } from "@/lib/demo-data";
import type { Team } from "@/lib/types";
import { Avatar, Modal } from "./ui";
import { Select } from "./select";
import { PagedList } from "./pagination";

export function TeamEditor({ onClose }: { onClose: () => void }) {
  const { state } = useDemo();
  const { user } = useSession();
  const { site } = useSite();
  const owned = state.teams.filter(
    (team) => team.foremanId === user?.id && site.teamIds.includes(team.id),
  );
  const [teamId, setTeamId] = useState(owned[0]?.id || "");
  const team = owned.find((item) => item.id === teamId);
  if (!team || user?.role !== "formen") return null;
  return (
    <Modal title="Ekipleri düzenle" onClose={onClose} wide>
      <TeamEditorForm
        key={team.id}
        team={team}
        owned={owned}
        onTeamChange={setTeamId}
        onClose={onClose}
      />
    </Modal>
  );
}
function TeamEditorForm({
  team,
  owned,
  onTeamChange,
  onClose,
}: {
  team: Team;
  owned: Team[];
  onTeamChange: (id: string) => void;
  onClose: () => void;
}) {
  const { state, saveTeam } = useDemo();
  const [name, setName] = useState(team.name);
  const [members, setMembers] = useState(team.workerIds);
  const [error, setError] = useState("");
  const available = seedTeams.find((item) => item.id === team.id)?.workerIds || team.workerIds;
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!saveTeam(team.id, name, members)) {
      setError("En az bir çalışan seçin ve ekip için farklı bir ad girin.");
      return;
    }
    onClose();
  }
  return (
    <form className="modal-form" onSubmit={submit}>
      <div className="form-body">
        <div className="form-grid team-editor-fields">
          <label className="field">
            Ekip
            <Select
              aria-label="Düzenlenecek ekip"
              value={team.id}
              onChange={(event) => onTeamChange(event.target.value)}
            >
              {owned.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="field">
            Ekip adı
            <input
              aria-label="Ekip adı"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={48}
            />
          </label>
        </div>
        <div className="team-editor-summary">
          <strong>{members.length} çalışan seçildi</strong>
          <span>{team.trade}</span>
        </div>
        <PagedList
          items={available}
          rowHeight={64}
          minColumnWidth={245}
          gap={6}
          className="crew-grid"
          label="Ekip üyeleri"
          renderItem={(id) => {
            const worker = person(id);
            const assigned = state.tasks.some(
              (task) => task.workerIds.includes(id) && task.status !== "completed",
            );
            return (
              <label
                className={`crew-option ${members.includes(id) ? "is-selected" : ""}`}
                key={id}
              >
                <input
                  type="checkbox"
                  aria-label={`${worker.name} ekip üyesi`}
                  checked={members.includes(id)}
                  onChange={(event) =>
                    setMembers(
                      event.target.checked
                        ? [...members, id]
                        : members.filter((value) => value !== id),
                    )
                  }
                />
                <Avatar user={worker} small />
                <span>
                  <strong>{worker.name}</strong>
                  <small>{assigned ? "Göreve atanmış" : worker.trade}</small>
                </span>
              </label>
            );
          }}
        />
        <p className="form-hint">Ekip değişikliği mevcut görev atamalarını değiştirmez.</p>
        {error && (
          <p className="form-message" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" type="button" onClick={onClose}>
          Vazgeç
        </button>
        <button className="btn btn-primary" type="submit" disabled={!members.length}>
          Ekibi kaydet
        </button>
      </div>
    </form>
  );
}
