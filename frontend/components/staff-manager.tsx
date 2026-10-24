"use client";
import { useEffect, useState } from "react";
type User = {
  id: number;
  email: string;
  role: string;
  active: number;
  password?: string;
};
export function StaffManager({ csrf }: { csrf: string }) {
  const [users, setUsers] = useState<User[]>([]),
    [edit, setEdit] = useState<User | null>(null),
    [notice, setNotice] = useState("");
  async function load() {
    const r = await fetch("/api/v1/admin/users");
    if (!r.ok) throw Error("Super administrator access required");
    setUsers((await r.json()).data);
  }
  useEffect(() => {
    load().catch((e) => setNotice(e.message));
  }, []);
  return (
    <div>
      <p>
        Changing an account revokes its active sessions. Passwords must contain
        at least 14 characters.
      </p>
      <button
        onClick={() =>
          setEdit({ id: 0, email: "", role: "editor", active: 1, password: "" })
        }
      >
        Create staff account
      </button>
      <p role="status">{notice}</p>
      {edit && (
        <form
          className="admin-editor"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await fetch(
              "/api/v1/admin/users" + (edit.id ? "/" + edit.id : ""),
              {
                method: edit.id ? "PUT" : "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-CSRF-Token": csrf,
                },
                body: JSON.stringify(edit),
              },
            );
            if (!r.ok) {
              setNotice(JSON.stringify((await r.json()).messages));
              return;
            }
            setEdit(null);
            await load();
            setNotice("Staff account saved");
          }}
        >
          <label>
            Email
            <input
              type="email"
              required
              value={edit.email}
              onChange={(e) => setEdit({ ...edit, email: e.target.value })}
            />
          </label>
          <label>
            Role
            <select
              value={edit.role}
              onChange={(e) => setEdit({ ...edit, role: e.target.value })}
            >
              {[
                "super_admin",
                "admin",
                "editor",
                "catalogue_manager",
                "enquiry_manager",
              ].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={14}
              required={!edit.id}
              value={edit.password || ""}
              onChange={(e) => setEdit({ ...edit, password: e.target.value })}
            />
          </label>
          <label>
            Account status
            <select
              value={edit.active}
              onChange={(e) =>
                setEdit({ ...edit, active: Number(e.target.value) })
              }
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </label>
          <button>Save account</button>
          <button type="button" onClick={() => setEdit(null)}>
            Cancel
          </button>
        </form>
      )}
      {users.map((u) => (
        <div className="admin-row" key={u.id}>
          <span>
            {u.email} · {u.role} · {u.active ? "Active" : "Inactive"}
          </span>
          <button onClick={() => setEdit({ ...u, password: "" })}>
            Edit account
          </button>
        </div>
      ))}
    </div>
  );
}
