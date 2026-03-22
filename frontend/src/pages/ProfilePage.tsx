import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../lib/apiError";
import type { Address, User } from "../types";

export const ProfilePage = () => {
  const { user: authUser, login, token } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [addr, setAddr] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    label: "",
    setAsDefault: false,
  });

  const fetchUser = async () => {
    const res = await api.get("/users/me");
    const u = res.data.data as User & { addresses?: Address[] };
    setUser(u);
    setName(u.name || "");
    setPhone(u.phone || "");
    setAddresses(u.addresses ?? []);
  };

  useEffect(() => {
    fetchUser()
      .catch(() => setMsg({ type: "err", text: "Failed to load profile" }))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.put("/users/me", { name, phone });
      await fetchUser();
      if (token && authUser) {
        login(token, { ...authUser, name, phone });
      }
      setMsg({ type: "ok", text: "Profile updated" });
    } catch (err) {
      setMsg({ type: "err", text: getApiErrorMessage(err, "Update failed") });
    } finally {
      setSaving(false);
    }
  };

  const addAddress = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.post("/users/address", {
        line1: addr.line1,
        line2: addr.line2 || undefined,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        label: addr.label || undefined,
        setAsDefault: addr.setAsDefault,
      });
      setAddr({
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        label: "",
        setAsDefault: false,
      });
      await fetchUser();
      setMsg({ type: "ok", text: "Address added" });
    } catch (err) {
      setMsg({ type: "err", text: getApiErrorMessage(err, "Could not add address") });
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm("Remove this address?")) return;
    setSaving(true);
    setMsg(null);
    try {
      await api.delete(`/users/address/${id}`);
      await fetchUser();
      setMsg({ type: "ok", text: "Address removed" });
    } catch (err) {
      setMsg({ type: "err", text: getApiErrorMessage(err, "Could not remove address") });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-8">
        <div className="h-10 w-40 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profile</h1>
        <p className="mt-1 text-slate-600">Manage your details and delivery addresses.</p>
      </div>

      {msg && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            msg.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleUpdate} className="card space-y-4 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Account</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none ring-orange-500/0 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/30"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-slate-500" value={user.email} disabled />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/30"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 …"
          />
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Addresses</h2>
        {addresses.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No saved addresses yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {addresses.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
              >
                <div className="text-sm text-slate-700">
                  <p className="font-medium text-slate-900">{a.line1}</p>
                  {a.line2 && <p>{a.line2}</p>}
                  <p>
                    {a.city}, {a.state} {a.postalCode}
                  </p>
                  <p>{a.country}</p>
                  {a.label && <p className="mt-1 text-xs text-slate-500">{a.label}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => deleteAddress(a.id)}
                  disabled={saving}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addAddress} className="mt-6 space-y-3 border-t border-slate-100 pt-6">
          <h3 className="text-sm font-semibold text-slate-800">Add address</h3>
          <input
            required
            placeholder="Address line 1"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={addr.line1}
            onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
          />
          <input
            placeholder="Address line 2 (optional)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={addr.line2}
            onChange={(e) => setAddr({ ...addr, line2: e.target.value })}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              required
              placeholder="City"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={addr.city}
              onChange={(e) => setAddr({ ...addr, city: e.target.value })}
            />
            <input
              required
              placeholder="State"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={addr.state}
              onChange={(e) => setAddr({ ...addr, state: e.target.value })}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              required
              placeholder="Postal code"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={addr.postalCode}
              onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })}
            />
            <input
              required
              placeholder="Country"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={addr.country}
              onChange={(e) => setAddr({ ...addr, country: e.target.value })}
            />
          </div>
          <input
            placeholder="Label (e.g. Home)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={addr.label}
            onChange={(e) => setAddr({ ...addr, label: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={addr.setAsDefault}
              onChange={(e) => setAddr({ ...addr, setAsDefault: e.target.checked })}
            />
            Set as default
          </label>
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            Add address
          </button>
        </form>
      </div>
    </div>
  );
};
