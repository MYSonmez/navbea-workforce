"use client";
import { useState } from "react";
import { sites, useSite } from "@/lib/sites";
import { Icon, Modal } from "./ui";
export function SiteSwitcher({ mobile = false }: { mobile?: boolean }) {
  const { site, changeSite } = useSite();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={mobile ? "site-switch-mobile" : "project-switch site-switch-button"}
        aria-label="Şantiye değiştir"
        onClick={() => setOpen(true)}
      >
        {!mobile && <span className="project-icon" />}
        <span>
          <strong>{site.name}</strong>
          {!mobile && <small>{site.address}</small>}
        </span>
        <Icon name="chevron" size={16} />
      </button>
      {open && (
        <Modal
          title="Şantiye seçimi"
          subtitle="Erişiminiz olan projeler"
          onClose={() => setOpen(false)}
        >
          <div className="form-body site-list">
            {sites.map((item) => (
              <button
                key={item.id}
                className={`site-choice ${site.id === item.id ? "is-selected" : ""}`}
                onClick={() => {
                  changeSite(item.id);
                  setOpen(false);
                }}
              >
                <span className="site-choice-photo" />
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.address} · {item.teamIds.length ? "Aktif proje" : "Ekip tanımlanmadı"}
                  </small>
                </span>
                <Icon name={site.id === item.id ? "check" : "right"} size={19} />
              </button>
            ))}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>
              Kapat
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
