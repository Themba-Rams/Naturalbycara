"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApiClient";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  active: boolean;
  created_at: string;
}

interface ServiceFormState {
  name: string;
  durationMinutes: string;
  price: string;
  active: boolean;
}

const EMPTY_FORM: ServiceFormState = {
  name: "",
  durationMinutes: "",
  price: "",
  active: true,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [addForm, setAddForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    adminFetch<{ services: Service[] }>("/api/admin/services")
      .then((data) => setServices(data.services))
      .catch(() => setError("Couldn't load services."));
  }

  useEffect(load, []);

  function parseForm(form: ServiceFormState): {
    name: string;
    durationMinutes: number;
    price: number | null;
    active: boolean;
  } | null {
    const name = form.name.trim();
    const durationMinutes = Number(form.durationMinutes);
    if (name.length === 0 || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return null;
    }
    const price = form.price.trim().length === 0 ? null : Number(form.price);
    if (price !== null && !Number.isFinite(price)) {
      return null;
    }
    return { name, durationMinutes, price, active: form.active };
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseForm(addForm);
    if (!parsed) {
      setAddError("Please enter a valid name and duration.");
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      await adminFetch("/api/admin/services", {
        method: "POST",
        body: JSON.stringify(parsed),
      });
      setAddForm(EMPTY_FORM);
      load();
    } catch {
      setAddError("Couldn't add that service. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(service: Service) {
    setEditingId(service.id);
    setEditForm({
      name: service.name,
      durationMinutes: String(service.duration_minutes),
      price: service.price === null ? "" : String(service.price),
      active: service.active,
    });
    setEditError(null);
  }

  async function handleSaveEdit(id: string) {
    const parsed = parseForm(editForm);
    if (!parsed) {
      setEditError("Please enter a valid name and duration.");
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      await adminFetch(`/api/admin/services/${id}`, {
        method: "PATCH",
        body: JSON.stringify(parsed),
      });
      setEditingId(null);
      load();
    } catch {
      setEditError("Couldn't save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(service: Service) {
    try {
      await adminFetch(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !service.active }),
      });
      load();
    } catch {
      setError("Couldn't update that service. Please try again.");
    }
  }

  async function handleDelete(service: Service) {
    if (!window.confirm(`Delete "${service.name}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/admin/services/${service.id}`, { method: "DELETE" });
      setServices((prev) => (prev ? prev.filter((s) => s.id !== service.id) : prev));
    } catch {
      setError("Couldn't delete that service. Please try again.");
    }
  }

  const inputClasses =
    "rounded-lg border border-border-default bg-surface-card-solid px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-border-accent focus:ring-2 focus:ring-accent/30";

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-semibold text-text-primary">Services</h2>

      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-card-solid p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end"
      >
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Name
          <input
            type="text"
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Duration (min)
          <input
            type="number"
            min={1}
            value={addForm.durationMinutes}
            onChange={(e) => setAddForm((f) => ({ ...f, durationMinutes: e.target.value }))}
            className={`w-28 ${inputClasses}`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Price (optional)
          <input
            type="number"
            min={0}
            step="0.01"
            value={addForm.price}
            onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))}
            className={`w-28 ${inputClasses}`}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={addForm.active}
            onChange={(e) => setAddForm((f) => ({ ...f, active: e.target.checked }))}
            className="h-4 w-4 rounded border-border-default text-accent accent-accent"
          />
          Active
        </label>
        <button
          type="submit"
          disabled={adding}
          className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-accent-contrast-text shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {adding ? "Adding…" : "Add service"}
        </button>
        {addError && <p className="w-full text-sm text-red-600">{addError}</p>}
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {services === null && !error && <p className="text-sm text-text-muted">Loading…</p>}
      {services !== null && services.length === 0 && (
        <p className="text-sm text-text-muted">No services yet.</p>
      )}

      {services !== null && services.length > 0 && (
        <ul className="flex flex-col gap-2">
          {services.map((service) => (
            <li
              key={service.id}
              className="rounded-xl border border-border-subtle bg-surface-card-solid p-4 shadow-sm"
            >
              {editingId === service.id ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <label className="flex flex-col gap-1 text-sm text-text-secondary">
                    Name
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className={inputClasses}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-text-secondary">
                    Duration (min)
                    <input
                      type="number"
                      min={1}
                      value={editForm.durationMinutes}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, durationMinutes: e.target.value }))
                      }
                      className={`w-28 ${inputClasses}`}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-text-secondary">
                    Price
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, price: e.target.value }))
                      }
                      className={`w-28 ${inputClasses}`}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={editForm.active}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, active: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-border-default text-accent accent-accent"
                    />
                    Active
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(service.id)}
                      disabled={saving}
                      className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast-text transition-colors hover:bg-accent-hover disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-full border border-border-default px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-accent hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                  {editError && <p className="w-full text-sm text-red-600">{editError}</p>}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-text-primary">
                      {service.name}
                      {!service.active && (
                        <span className="ml-2 rounded-full bg-bg-surface-alt px-2 py-0.5 text-xs font-medium text-text-muted">
                          Inactive
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-text-muted">
                      {service.duration_minutes} min
                      {service.price !== null ? ` · R${service.price}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(service)}
                      className="text-sm font-medium text-text-secondary hover:text-text-primary"
                    >
                      {service.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(service)}
                      className="text-sm font-medium text-accent-secondary hover:text-accent-secondary-hover"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(service)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
