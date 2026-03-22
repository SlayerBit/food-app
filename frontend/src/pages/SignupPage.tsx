import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getApiErrorMessage } from "../lib/apiError";

export const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/signup", { name, email, password });
      navigate("/login");
    } catch (err) {
      setError(getApiErrorMessage(err, "Signup failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md card p-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/30"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/30"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/30"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-orange-600 hover:text-orange-700">
          Login
        </Link>
      </p>
    </div>
  );
};
