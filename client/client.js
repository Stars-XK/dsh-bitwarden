window.__ModuleLoader__.load({
  id: "dsh-bitwarden",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// client/src/index.jsx
var index_exports = {};
__export(index_exports, {
  VaultSection: () => VaultSection,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react = require("react");
var NS = "dsh-bitwarden";
var TYPE_KEY = { 1: "type.login", 2: "type.note", 3: "type.card", 4: "type.identity" };
var CSS = `
.dsh-bw { display:flex; flex-direction:column; gap:14px; }
.dsh-bw-bar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.dsh-bw-badge { display:inline-flex; align-items:center; gap:6px; font-size:12px; padding:3px 10px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); color:var(--dsw-alias-label-secondary); }
.dsh-bw-dot { width:7px; height:7px; border-radius:50%; background:var(--dsw-alias-state-idle-primary); }
.dsh-bw-dot.on { background:var(--dsw-alias-state-success-primary); }
.dsh-bw-dot.warn { background:var(--dsw-alias-state-warn-primary); }
.dsh-bw-dot.err { background:var(--dsw-alias-state-error-primary); }
.dsh-bw-spacer { flex:1; }
.dsh-bw-btn { display:inline-flex; align-items:center; gap:6px; font-size:13px; line-height:1; padding:7px 12px; border-radius:8px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); cursor:pointer; }
.dsh-bw-btn:hover { border-color:var(--dsw-alias-border-l2); }
.dsh-bw-btn:disabled { opacity:.5; cursor:default; }
.dsh-bw-btn.primary { background:var(--dsw-alias-brand-primary); border-color:var(--dsw-alias-brand-primary); color:#fff; }
.dsh-bw-btn.ghost { background:transparent; }
.dsh-bw-btn.danger { color:var(--dsw-alias-state-error-primary); }
.dsh-bw-btn.sm { padding:5px 9px; font-size:12px; }
.dsh-bw-body { display:grid; grid-template-columns:minmax(210px,264px) minmax(0,1fr); gap:12px; align-items:start; }
.dsh-bw-pane { border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-layer-1); overflow:hidden; }
.dsh-bw-search { display:flex; gap:6px; padding:9px; border-bottom:1px solid var(--dsw-alias-border-l1); }
.dsh-bw-input { width:100%; box-sizing:border-box; font-size:13px; padding:7px 9px; border-radius:7px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); outline:none; }
.dsh-bw-input:focus { border-color:var(--dsw-alias-brand-primary); }
.dsh-bw-chips { display:flex; gap:5px; padding:0 9px 8px; flex-wrap:wrap; }
.dsh-bw-chip { font-size:12px; padding:3px 8px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); color:var(--dsw-alias-label-secondary); background:transparent; cursor:pointer; }
.dsh-bw-chip.on { border-color:var(--dsw-alias-brand-primary); color:var(--dsw-alias-brand-primary); }
.dsh-bw-list { max-height:440px; overflow:auto; }
.dsh-bw-folders { display:flex; gap:5px; padding:0 9px 8px; flex-wrap:nowrap; overflow-x:auto; scrollbar-width:thin; }
.dsh-bw-group-head { font-size:11px; font-weight:600; letter-spacing:.2px; color:var(--dsw-alias-label-secondary); padding:7px 11px 5px; background:var(--dsw-alias-bg-layer-2); position:sticky; top:0; z-index:1; }
.dsh-bw-item { display:block; width:100%; text-align:left; padding:9px 11px; border:0; border-bottom:1px solid var(--dsw-alias-border-l1); background:transparent; cursor:pointer; color:var(--dsw-alias-label-primary); }
.dsh-bw-item:hover { background:var(--dsw-alias-bg-layer-2); }
.dsh-bw-item.on { background:var(--dsw-alias-bg-layer-2); box-shadow:inset 3px 0 0 var(--dsw-alias-brand-primary); }
.dsh-bw-item-name { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dsh-bw-item-sub { font-size:12px; color:var(--dsw-alias-label-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
.dsh-bw-empty { padding:22px 12px; text-align:center; font-size:12px; color:var(--dsw-alias-label-secondary); }
.dsh-bw-detail { padding:14px; }
.dsh-bw-title { font-size:15px; font-weight:600; margin:0 0 2px; word-break:break-all; }
.dsh-bw-sub { font-size:12px; color:var(--dsw-alias-label-secondary); margin-bottom:12px; }
.dsh-bw-field { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px dashed var(--dsw-alias-border-l1); }
.dsh-bw-label { width:64px; flex:none; font-size:12px; color:var(--dsw-alias-label-secondary); }
.dsh-bw-value { flex:1; min-width:0; font-size:13px; word-break:break-all; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
.dsh-bw-form { display:flex; flex-direction:column; gap:10px; padding:14px; }
.dsh-bw-form-row { display:flex; flex-direction:column; gap:4px; }
.dsh-bw-form-label { font-size:12px; color:var(--dsw-alias-label-secondary); }
.dsh-bw-notice { font-size:12px; padding:8px 10px; border-radius:8px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-2); }
.dsh-bw-notice.err { border-color:var(--dsw-alias-state-error-primary); color:var(--dsw-alias-state-error-primary); }
.dsh-bw-notice.ok { border-color:var(--dsw-alias-state-success-primary); color:var(--dsw-alias-state-success-primary); }
.dsh-bw-audit { max-height:360px; overflow:auto; font-size:12px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
.dsh-bw-audit-row { padding:5px 10px; border-bottom:1px solid var(--dsw-alias-border-l1); display:flex; gap:8px; }
.dsh-bw-audit-at { color:var(--dsw-alias-label-secondary); flex:none; }
.dsh-bw-hint { font-size:12px; color:var(--dsw-alias-label-secondary); line-height:1.6; }
@media (max-width:640px){ .dsh-bw-body { grid-template-columns:1fr; } }
`;
function Btn({ children, primary, ghost, danger, sm, ...rest }) {
  const cls = ["dsh-bw-btn", primary ? "primary" : "", ghost ? "ghost" : "", danger ? "danger" : "", sm ? "sm" : ""].filter(Boolean).join(" ");
  return /* @__PURE__ */ React.createElement("button", { type: "button", className: cls, ...rest }, children);
}
function Field({ label, value, mono = true, actions }) {
  return /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-field" }, /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-label" }, label), /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-value", style: mono ? void 0 : { fontFamily: "inherit" } }, value), actions);
}
function VaultSection({ rpcCall: rpcCall2, t }) {
  const [status, setStatus] = (0, import_react.useState)(null);
  const [items, setItems] = (0, import_react.useState)([]);
  const [folders, setFolders] = (0, import_react.useState)([]);
  const [folderFilter, setFolderFilter] = (0, import_react.useState)("all");
  const [query, setQuery] = (0, import_react.useState)("");
  const [typeFilter, setTypeFilter] = (0, import_react.useState)("all");
  const [selectedId, setSelectedId] = (0, import_react.useState)(null);
  const [detail, setDetail] = (0, import_react.useState)(null);
  const [revealed, setRevealed] = (0, import_react.useState)(false);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [notice, setNotice] = (0, import_react.useState)(null);
  const [view, setView] = (0, import_react.useState)("vault");
  const [loginForm, setLoginForm] = (0, import_react.useState)({ serverUrl: "", email: "", password: "", remember: true });
  const [unlockPassword, setUnlockPassword] = (0, import_react.useState)("");
  const [createForm, setCreateForm] = (0, import_react.useState)({ name: "", username: "", password: "", uris: "", notes: "" });
  const [prefs, setPrefs] = (0, import_react.useState)({ idleLockMinutes: 15, autoUnlock: true, auditEnabled: true });
  const [audit, setAudit] = (0, import_react.useState)([]);
  const searchTimer = (0, import_react.useRef)(null);
  const call = (0, import_react.useCallback)(async (endpoint, payload) => {
    const res = await rpcCall2(endpoint, payload ?? {});
    if (res && typeof res === "object" && "ok" in res) {
      if (res.ok) return res.value;
      throw new Error(res.error?.message ?? "\u8BF7\u6C42\u5931\u8D25");
    }
    return res;
  }, [rpcCall2]);
  const setOk = (text) => setNotice({ kind: "ok", text });
  const setErr = (text) => setNotice({ kind: "err", text: String(text?.message ?? text) });
  const refreshStatus = (0, import_react.useCallback)(async () => {
    try {
      const next = await call("status");
      setStatus(next);
      setPrefs({
        idleLockMinutes: next.idleLockMinutes ?? 15,
        autoUnlock: next.autoUnlock !== false,
        auditEnabled: next.auditEnabled !== false
      });
      if (!loginForm.serverUrl && next.serverUrl) {
        setLoginForm((prev) => ({ ...prev, serverUrl: next.serverUrl }));
      }
      if (!loginForm.email && next.email) {
        setLoginForm((prev) => ({ ...prev, email: next.email }));
      }
      return next;
    } catch (error) {
      setErr(error);
      return null;
    }
  }, [call, loginForm.serverUrl, loginForm.email]);
  const loadItems = (0, import_react.useCallback)(async (nextQuery, nextType) => {
    setBusy(true);
    try {
      const res = await call("list", { query: nextQuery, type: nextType });
      setItems(res?.items ?? []);
      setNotice(null);
    } catch (error) {
      setItems([]);
      setErr(error);
    } finally {
      setBusy(false);
    }
  }, [call]);
  const loadFolders = (0, import_react.useCallback)(async () => {
    try {
      const res = await call("folders");
      setFolders(Array.isArray(res) ? res : []);
    } catch {
      setFolders([]);
    }
  }, [call]);
  const loadAudit = (0, import_react.useCallback)(async () => {
    try {
      const res = await call("audit", { limit: 200 });
      setAudit(res?.entries ?? []);
    } catch (error) {
      setErr(error);
    }
  }, [call]);
  const openDetail = (0, import_react.useCallback)(async (id) => {
    setSelectedId(id);
    setRevealed(false);
    setDetail(null);
    if (!id) return;
    setBusy(true);
    try {
      setDetail(await call("reveal", { id }));
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  }, [call]);
  (0, import_react.useEffect)(() => {
    refreshStatus().then(async (next) => {
      if (next && (next.status === "unlocked" || next.cliStatus === "unlocked" || next.hasMasterPassword)) {
        await loadItems("", "all");
        loadFolders();
      }
    });
  }, []);
  (0, import_react.useEffect)(() => {
    if (!status) return;
    if (status.cliStatus === "unauthenticated") setView("login");
    else if (view === "login") setView("vault");
  }, [status?.cliStatus]);
  (0, import_react.useEffect)(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (status && status.cliStatus !== "unauthenticated") loadItems(query, typeFilter);
    }, 260);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, typeFilter, status?.cliStatus]);
  const copy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value ?? "");
      setOk(t("copied", { label }));
    } catch (error) {
      setErr(error);
    }
  };
  const doLogin = async () => {
    setBusy(true);
    try {
      const next = await call("connect", loginForm);
      setStatus(next);
      setLoginForm((prev) => ({ ...prev, password: "" }));
      setView("vault");
      setOk(t("connected"));
      await loadItems("", "all");
      loadFolders();
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  };
  const doUnlock = async (useSaved) => {
    setBusy(true);
    try {
      const next = await call(useSaved ? "unlockSaved" : "unlock", useSaved ? {} : { password: unlockPassword });
      setStatus(next);
      setUnlockPassword("");
      setOk(t("unlocked"));
      await loadItems(query, typeFilter);
      loadFolders();
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  };
  const doLock = async () => {
    setBusy(true);
    try {
      setStatus(await call("lock"));
      setDetail(null);
      setSelectedId(null);
      setOk(t("locked"));
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  };
  const doSync = async () => {
    setBusy(true);
    try {
      setStatus(await call("sync"));
      await loadItems(query, typeFilter);
      setOk(t("synced"));
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  };
  const doCreate = async () => {
    setBusy(true);
    try {
      await call("create", {
        name: createForm.name,
        username: createForm.username,
        password: createForm.password,
        uris: createForm.uris.split(/[\s,]+/).filter(Boolean),
        notes: createForm.notes
      });
      setCreateForm({ name: "", username: "", password: "", uris: "", notes: "" });
      setView("vault");
      setOk(t("created"));
      await loadItems(query, typeFilter);
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  };
  const doDelete = async () => {
    if (!detail?.id) return;
    const yes = window.confirm(t("confirmDelete", { name: detail.name }));
    if (!yes) return;
    setBusy(true);
    try {
      await call("delete", { id: detail.id });
      setDetail(null);
      setSelectedId(null);
      setOk(t("deleted"));
      await loadItems(query, typeFilter);
    } catch (error) {
      setErr(error);
    } finally {
      setBusy(false);
    }
  };
  const savePrefs = async (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      await call("saveSettings", next);
    } catch (error) {
      setErr(error);
    }
  };
  const forgetMaster = async () => {
    const yes = window.confirm(t("confirmForget"));
    if (!yes) return;
    try {
      await call("forgetMaster");
      await refreshStatus();
      setOk(t("forgotten"));
    } catch (error) {
      setErr(error);
    }
  };
  const statusLabel = (0, import_react.useMemo)(() => {
    if (!status) return t("status.loading");
    if (status.cliStatus === "unauthenticated") return t("status.unauthenticated");
    if (status.status === "unlocked") return t("status.unlocked");
    if (status.cliStatus === "locked") return t("status.locked");
    return t("status.unknown");
  }, [status, t]);
  const dotClass = (0, import_react.useMemo)(() => {
    if (!status) return "dsh-bw-dot";
    if (status.cliStatus === "unauthenticated") return "dsh-bw-dot err";
    if (status.status === "unlocked") return "dsh-bw-dot on";
    return "dsh-bw-dot warn";
  }, [status]);
  const authed = Boolean(status && status.cliStatus !== "unauthenticated");
  const foldersById = (0, import_react.useMemo)(() => {
    const map = {};
    for (const folder of folders) map[folder.id] = folder.name;
    return map;
  }, [folders]);
  const filtered = (0, import_react.useMemo)(() => items.filter((item) => {
    if (folderFilter === "all") return true;
    if (folderFilter === "__none__") return !item.folderId;
    return item.folderId === folderFilter;
  }), [items, folderFilter]);
  const groups = (0, import_react.useMemo)(() => {
    if (folderFilter !== "all") return null;
    const map = /* @__PURE__ */ new Map();
    for (const item of filtered) {
      const key = item.folderId || "__none__";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.entries()].sort((a, b) => {
      const an = a[0] === "__none__" ? "\uFFFF" : foldersById[a[0]] || "";
      const bn = b[0] === "__none__" ? "\uFFFF" : foldersById[b[0]] || "";
      return an.localeCompare(bn, "zh");
    });
  }, [filtered, folderFilter, foldersById]);
  const renderItem = (item) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: item.id,
      type: "button",
      className: `dsh-bw-item ${selectedId === item.id ? "on" : ""}`,
      onClick: () => openDetail(item.id)
    },
    /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-item-name" }, item.name || t("list.untitled")),
    /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-item-sub" }, [item.username, item.uris?.[0], t(TYPE_KEY[item.type] ?? "type.login")].filter(Boolean).join(" \xB7 "))
  );
  return /* @__PURE__ */ React.createElement("div", { className: "dsh-bw" }, /* @__PURE__ */ React.createElement("style", null, CSS), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-bar" }, /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-badge" }, /* @__PURE__ */ React.createElement("span", { className: dotClass }), statusLabel), status?.email ? /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-badge" }, status.email) : null, status?.serverUrl ? /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-badge" }, status.serverUrl) : null, /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-spacer" }), view !== "vault" ? /* @__PURE__ */ React.createElement(Btn, { sm: true, ghost: true, onClick: () => setView("vault") }, t("nav.vault")) : null, view !== "create" ? /* @__PURE__ */ React.createElement(Btn, { sm: true, onClick: () => setView("create") }, t("nav.create")) : null, view !== "settings" ? /* @__PURE__ */ React.createElement(Btn, { sm: true, onClick: () => setView("settings") }, t("nav.settings")) : null, view !== "audit" ? /* @__PURE__ */ React.createElement(Btn, { sm: true, onClick: () => {
    setView("audit");
    loadAudit();
  } }, t("nav.audit")) : null, status && status.cliStatus !== "unauthenticated" ? /* @__PURE__ */ React.createElement(Btn, { sm: true, onClick: doSync, disabled: busy }, t("action.sync")) : null, status && status.status === "unlocked" ? /* @__PURE__ */ React.createElement(Btn, { sm: true, onClick: doLock, disabled: busy }, t("action.lock")) : null), notice ? /* @__PURE__ */ React.createElement("div", { className: `dsh-bw-notice ${notice.kind}` }, notice.text) : null, !authed ? /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-pane" }, /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-form" }, /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-hint" }, t("login.hint")), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-form-row" }, /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-form-label" }, t("login.server")), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "dsh-bw-input",
      value: loginForm.serverUrl,
      placeholder: "https://vault.example.com",
      onChange: (e) => setLoginForm({ ...loginForm, serverUrl: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-form-row" }, /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-form-label" }, t("login.email")), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "dsh-bw-input",
      value: loginForm.email,
      autoComplete: "username",
      onChange: (e) => setLoginForm({ ...loginForm, email: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-form-row" }, /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-form-label" }, t("login.password")), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "dsh-bw-input",
      type: "password",
      value: loginForm.password,
      autoComplete: "current-password",
      onChange: (e) => setLoginForm({ ...loginForm, password: e.target.value }),
      onKeyDown: (e) => {
        if (e.key === "Enter") doLogin();
      }
    }
  )), /* @__PURE__ */ React.createElement("label", { className: "dsh-bw-hint", style: { display: "flex", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: loginForm.remember,
      onChange: (e) => setLoginForm({ ...loginForm, remember: e.target.checked })
    }
  ), t("login.remember")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Btn, { primary: true, onClick: doLogin, disabled: busy }, t("login.submit"))))) : null, authed && view === "vault" && status.status !== "unlocked" ? /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-pane" }, /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-form" }, /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-hint" }, t("locked.hint")), status.hasMasterPassword ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Btn, { primary: true, onClick: () => doUnlock(true), disabled: busy }, t("locked.useSaved"))) : null, /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-form-row" }, /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-form-label" }, t("locked.password")), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "dsh-bw-input",
      type: "password",
      value: unlockPassword,
      onChange: (e) => setUnlockPassword(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter") doUnlock(false);
      }
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Btn, { onClick: () => doUnlock(false), disabled: busy }, t("locked.submit"))))) : null, authed && view === "vault" && status.status === "unlocked" ? /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-body" }, /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-pane" }, /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-search" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "dsh-bw-input",
      value: query,
      placeholder: t("search.placeholder"),
      onChange: (e) => setQuery(e.target.value)
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-chips" }, ["all", "login", "note", "card", "identity"].map((key) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key,
      type: "button",
      className: `dsh-bw-chip ${typeFilter === key ? "on" : ""}`,
      onClick: () => setTypeFilter(key)
    },
    t(key === "all" ? "filter.all" : `type.${key}`)
  ))), folders.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-folders" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `dsh-bw-chip ${folderFilter === "all" ? "on" : ""}`,
      onClick: () => setFolderFilter("all")
    },
    t("filter.folder.all")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `dsh-bw-chip ${folderFilter === "__none__" ? "on" : ""}`,
      onClick: () => setFolderFilter("__none__")
    },
    t("filter.folder.none")
  ), folders.filter((folder) => folder.name).map((folder) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: folder.id,
      type: "button",
      className: `dsh-bw-chip ${folderFilter === folder.id ? "on" : ""}`,
      onClick: () => setFolderFilter(folder.id)
    },
    folder.name
  ))) : null, /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-list" }, filtered.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-empty" }, busy ? t("list.loading") : t("list.empty")) : groups ? groups.map(([folderId, groupItems]) => /* @__PURE__ */ React.createElement("div", { key: folderId }, /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-group-head" }, folderId === "__none__" ? t("filter.folder.none") : foldersById[folderId] || t("filter.folder.none"), " \xB7 ", groupItems.length), groupItems.map(renderItem))) : filtered.map(renderItem))), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-pane" }, !detail ? /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-empty" }, t("detail.empty")) : /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-detail" }, /* @__PURE__ */ React.createElement("h4", { className: "dsh-bw-title" }, detail.name || t("list.untitled")), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-sub" }, t(TYPE_KEY[detail.type] ?? "type.login")), detail.login?.username !== void 0 ? /* @__PURE__ */ React.createElement(
    Field,
    {
      label: t("field.username"),
      value: detail.login.username || "\u2014",
      actions: detail.login.username ? /* @__PURE__ */ React.createElement(Btn, { sm: true, ghost: true, onClick: () => copy(detail.login.username, t("field.username")) }, t("action.copy")) : null
    }
  ) : null, detail.login?.password !== void 0 ? /* @__PURE__ */ React.createElement(
    Field,
    {
      label: t("field.password"),
      value: revealed ? detail.login.password || "\u2014" : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      actions: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Btn, { sm: true, ghost: true, onClick: () => setRevealed((prev) => !prev) }, revealed ? t("action.hide") : t("action.show")), /* @__PURE__ */ React.createElement(Btn, { sm: true, ghost: true, onClick: () => copy(detail.login.password, t("field.password")) }, t("action.copy")))
    }
  ) : null, Array.isArray(detail.login?.uris) && detail.login.uris.length ? detail.login.uris.map((uri, index) => /* @__PURE__ */ React.createElement(
    Field,
    {
      key: `${uri.uri}-${index}`,
      label: t("field.uri"),
      value: uri.uri || "\u2014",
      actions: uri.uri ? /* @__PURE__ */ React.createElement(Btn, { sm: true, ghost: true, onClick: () => window.open(uri.uri, "_blank", "noopener") }, t("action.open")) : null
    }
  )) : null, detail.notes ? /* @__PURE__ */ React.createElement(Field, { label: t("field.notes"), mono: false, value: detail.notes }) : null, /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(Btn, { sm: true, danger: true, onClick: doDelete, disabled: busy }, t("action.delete")))))) : null, authed && view === "create" ? /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-pane" }, /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-form" }, /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-hint" }, t("create.hint")), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-form-row" }, /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-form-label" }, t("create.name")), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "dsh-bw-input",
      value: createForm.name,
      onChange: (e) => setCreateForm({ ...createForm, name: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-form-row" }, /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-form-label" }, t("field.username")), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "dsh-bw-input",
      value: createForm.username,
      onChange: (e) => setCreateForm({ ...createForm, username: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-form-row" }, /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-form-label" }, t("field.password")), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "dsh-bw-input",
      value: createForm.password,
      onChange: (e) => setCreateForm({ ...createForm, password: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-form-row" }, /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-form-label" }, t("field.uri")), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "dsh-bw-input",
      value: createForm.uris,
      placeholder: "https://...",
      onChange: (e) => setCreateForm({ ...createForm, uris: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-form-row" }, /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-form-label" }, t("field.notes")), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "dsh-bw-input",
      value: createForm.notes,
      onChange: (e) => setCreateForm({ ...createForm, notes: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(Btn, { primary: true, onClick: doCreate, disabled: busy || !createForm.name.trim() }, t("create.submit")), /* @__PURE__ */ React.createElement(Btn, { ghost: true, onClick: () => setView("vault") }, t("action.cancel"))))) : null, authed && view === "settings" ? /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-pane" }, /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-form" }, /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-form-row" }, /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-form-label" }, t("prefs.idle")), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "dsh-bw-input",
      type: "number",
      min: "0",
      max: "240",
      value: prefs.idleLockMinutes,
      onChange: (e) => savePrefs({ idleLockMinutes: Number(e.target.value) })
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-hint" }, t("prefs.idleHint"))), /* @__PURE__ */ React.createElement("label", { className: "dsh-bw-hint", style: { display: "flex", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: prefs.autoUnlock,
      onChange: (e) => savePrefs({ autoUnlock: e.target.checked })
    }
  ), t("prefs.autoUnlock")), /* @__PURE__ */ React.createElement("label", { className: "dsh-bw-hint", style: { display: "flex", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: prefs.auditEnabled,
      onChange: (e) => savePrefs({ auditEnabled: e.target.checked })
    }
  ), t("prefs.audit")), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-bar" }, /* @__PURE__ */ React.createElement(Btn, { danger: true, onClick: forgetMaster }, t("prefs.forget"))), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-hint" }, t("prefs.dataDir"), " ", status?.dataDir ?? "\u2014"), /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-hint" }, t("prefs.bw"), " ", status?.bwScript ?? t("prefs.bwMissing")))) : null, authed && view === "audit" ? /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-pane" }, /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-audit" }, audit.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-empty" }, t("audit.empty")) : audit.map((entry, index) => /* @__PURE__ */ React.createElement("div", { className: "dsh-bw-audit-row", key: `${entry.at}-${index}` }, /* @__PURE__ */ React.createElement("span", { className: "dsh-bw-audit-at" }, String(entry.at ?? "").replace("T", " ").slice(0, 19)), /* @__PURE__ */ React.createElement("span", null, entry.action, entry.name ? ` \xB7 ${entry.name}` : "", entry.result ? ` \xB7 ${entry.result}` : ""))))) : null);
}
var ZH = {
  section: "\u5BC6\u7801\u5E93",
  "status.loading": "\u8BFB\u53D6\u4E2D\u2026",
  "status.unauthenticated": "\u672A\u767B\u5F55",
  "status.locked": "\u5DF2\u9501\u5B9A",
  "status.unlocked": "\u5DF2\u89E3\u9501",
  "status.unknown": "\u672A\u77E5",
  "nav.vault": "\u5BC6\u7801\u5E93",
  "nav.create": "\u65B0\u5EFA\u6761\u76EE",
  "nav.settings": "\u504F\u597D",
  "nav.audit": "\u5BA1\u8BA1",
  "action.sync": "\u540C\u6B65",
  "action.lock": "\u9501\u5B9A",
  "action.copy": "\u590D\u5236",
  "action.show": "\u663E\u793A",
  "action.hide": "\u9690\u85CF",
  "action.open": "\u6253\u5F00",
  "action.delete": "\u5220\u9664\u6761\u76EE",
  "action.cancel": "\u53D6\u6D88",
  "login.hint": "\u8FDE\u63A5 Bitwarden / Vaultwarden\u3002\u4E3B\u5BC6\u7801\u4FDD\u5B58\u5728\u7CFB\u7EDF\u51ED\u636E\u5B58\u50A8\u4E2D\uFF0C\u4E0D\u4F1A\u5199\u8FDB\u914D\u7F6E\u6587\u4EF6\u3002",
  "login.server": "\u670D\u52A1\u5668\u5730\u5740",
  "login.email": "\u90AE\u7BB1",
  "login.password": "\u4E3B\u5BC6\u7801",
  "login.remember": "\u4FDD\u5B58\u4E3B\u5BC6\u7801\u4EE5\u4FBF\u81EA\u52A8\u89E3\u9501",
  "login.submit": "\u767B\u5F55\u5E76\u89E3\u9501",
  "locked.hint": "\u5BC6\u7801\u5E93\u5DF2\u9501\u5B9A\u3002",
  "locked.useSaved": "\u7528\u5DF2\u4FDD\u5B58\u7684\u4E3B\u5BC6\u7801\u89E3\u9501",
  "locked.password": "\u4E3B\u5BC6\u7801",
  "locked.submit": "\u89E3\u9501",
  "search.placeholder": "\u641C\u7D22\u540D\u79F0\u3001\u7528\u6237\u540D\u6216\u7F51\u5740",
  "filter.all": "\u5168\u90E8",
  "filter.folder.all": "\u5168\u90E8\u6587\u4EF6\u5939",
  "filter.folder.none": "\u672A\u5206\u7C7B",
  "list.loading": "\u52A0\u8F7D\u4E2D\u2026",
  "list.empty": "\u6CA1\u6709\u5339\u914D\u7684\u6761\u76EE",
  "list.untitled": "\u672A\u547D\u540D",
  "detail.empty": "\u4ECE\u5DE6\u4FA7\u9009\u62E9\u4E00\u4E2A\u6761\u76EE\u67E5\u770B\u8BE6\u60C5",
  "field.username": "\u7528\u6237\u540D",
  "field.password": "\u5BC6\u7801",
  "field.uri": "\u7F51\u5740",
  "field.notes": "\u5907\u6CE8",
  "create.hint": "\u65B0\u5EFA\u4E00\u6761\u767B\u5F55\u6761\u76EE\u3002\u5BC6\u7801\u53EA\u8FDB\u5165\u5BC6\u7801\u5E93\u3002",
  "create.name": "\u540D\u79F0",
  "create.submit": "\u521B\u5EFA",
  "prefs.idle": "\u7A7A\u95F2\u81EA\u52A8\u9501\u5B9A\uFF08\u5206\u949F\uFF0C0 \u8868\u793A\u4E0D\u9501\u5B9A\uFF09",
  "prefs.idleHint": "\u8D85\u8FC7\u8BE5\u65F6\u957F\u6CA1\u6709\u8BBF\u95EE\u65F6\u81EA\u52A8\u6267\u884C bw lock \u5E76\u4E22\u5F03\u4F1A\u8BDD\u5BC6\u94A5\u3002",
  "prefs.autoUnlock": "\u5141\u8BB8 AI \u5728\u9700\u8981\u65F6\u7528\u5DF2\u4FDD\u5B58\u7684\u4E3B\u5BC6\u7801\u81EA\u52A8\u89E3\u9501",
  "prefs.audit": "\u8BB0\u5F55\u5BA1\u8BA1\u65E5\u5FD7",
  "prefs.forget": "\u5220\u9664\u5DF2\u4FDD\u5B58\u7684\u4E3B\u5BC6\u7801",
  "prefs.dataDir": "\u6570\u636E\u76EE\u5F55\uFF1A",
  "prefs.bw": "bw \u5F15\u64CE\uFF1A",
  "prefs.bwMissing": "\u672A\u627E\u5230\uFF08\u8BF7\u68C0\u67E5\u4F9D\u8D56\u5B89\u88C5\uFF09",
  "audit.empty": "\u6682\u65E0\u5BA1\u8BA1\u8BB0\u5F55",
  "copied": "\u5DF2\u590D\u5236{label}",
  "connected": "\u5DF2\u8FDE\u63A5\u5E76\u89E3\u9501",
  "unlocked": "\u5DF2\u89E3\u9501",
  "locked": "\u5DF2\u9501\u5B9A",
  "synced": "\u5DF2\u540C\u6B65",
  "created": "\u6761\u76EE\u5DF2\u521B\u5EFA",
  "deleted": "\u6761\u76EE\u5DF2\u5220\u9664",
  "forgotten": "\u5DF2\u5220\u9664\u4FDD\u5B58\u7684\u4E3B\u5BC6\u7801",
  "confirmDelete": "\u786E\u5B9A\u5220\u9664\u300C{name}\u300D\uFF1F\u8BE5\u64CD\u4F5C\u4F1A\u540C\u6B65\u5230\u670D\u52A1\u5668\u3002",
  "confirmForget": "\u5220\u9664\u5DF2\u4FDD\u5B58\u7684\u4E3B\u5BC6\u7801\u540E\uFF0CAI \u5C06\u65E0\u6CD5\u81EA\u52A8\u89E3\u9501\u3002\u786E\u5B9A\u5417\uFF1F",
  "type.login": "\u767B\u5F55",
  "type.note": "\u7B14\u8BB0",
  "type.card": "\u94F6\u884C\u5361",
  "type.identity": "\u8EAB\u4EFD"
};
var EN = {
  section: "Vault",
  "status.loading": "Loading\u2026",
  "status.unauthenticated": "Signed out",
  "status.locked": "Locked",
  "status.unlocked": "Unlocked",
  "status.unknown": "Unknown",
  "nav.vault": "Vault",
  "nav.create": "New item",
  "nav.settings": "Preferences",
  "nav.audit": "Audit",
  "action.sync": "Sync",
  "action.lock": "Lock",
  "action.copy": "Copy",
  "action.show": "Show",
  "action.hide": "Hide",
  "action.open": "Open",
  "action.delete": "Delete item",
  "action.cancel": "Cancel",
  "login.hint": "Connect Bitwarden / Vaultwarden. The master password is kept in the system credential store, never in configuration.",
  "login.server": "Server URL",
  "login.email": "Email",
  "login.password": "Master password",
  "login.remember": "Save the master password for automatic unlock",
  "login.submit": "Sign in and unlock",
  "locked.hint": "The vault is locked.",
  "locked.useSaved": "Unlock with the saved master password",
  "locked.password": "Master password",
  "locked.submit": "Unlock",
  "search.placeholder": "Search name, username or URL",
  "filter.all": "All",
  "filter.folder.all": "All folders",
  "filter.folder.none": "Unfiled",
  "list.loading": "Loading\u2026",
  "list.empty": "No matching item",
  "list.untitled": "Untitled",
  "detail.empty": "Pick an item on the left to see details",
  "field.username": "Username",
  "field.password": "Password",
  "field.uri": "URL",
  "field.notes": "Notes",
  "create.hint": "Create a login item. The password goes straight into the vault.",
  "create.name": "Name",
  "create.submit": "Create",
  "prefs.idle": "Idle auto-lock (minutes, 0 disables)",
  "prefs.idleHint": "Runs bw lock and drops the session key after this much inactivity.",
  "prefs.autoUnlock": "Let the agent auto-unlock with the saved master password",
  "prefs.audit": "Record the audit log",
  "prefs.forget": "Delete the saved master password",
  "prefs.dataDir": "Data directory:",
  "prefs.bw": "bw engine:",
  "prefs.bwMissing": "not found (check dependencies)",
  "audit.empty": "No audit entry yet",
  "copied": "Copied {label}",
  "connected": "Connected and unlocked",
  "unlocked": "Unlocked",
  "locked": "Locked",
  "synced": "Synced",
  "created": "Item created",
  "deleted": "Item deleted",
  "forgotten": "Saved master password deleted",
  "confirmDelete": 'Delete "{name}"? The change is synced to the server.',
  "confirmForget": "Without the saved master password the agent cannot auto-unlock. Continue?",
  "type.login": "Login",
  "type.note": "Note",
  "type.card": "Card",
  "type.identity": "Identity"
};
var inject = ["slots", "locale"];
async function rpcCall(endpoint, payload) {
  const response = await fetch("/dsh-bitwarden/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint, payload: payload ?? {} })
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return data;
}
function apply(ctx) {
  const translate = ctx.locale.bind(NS);
  ctx.effect(() => ctx.locale.register(NS, { zh: ZH, en: EN }), "dsh-bitwarden: dictionaries");
  ctx.slots.inject("settings.section", () => ctx.slots.register(
    {
      name: "settings.section",
      id: "dsh-bitwarden",
      order: 32,
      label: () => translate("section"),
      inject: () => ({ rpcCall, t: translate })
    },
    VaultSection
  ));
}

    return module.exports;
  }
});
