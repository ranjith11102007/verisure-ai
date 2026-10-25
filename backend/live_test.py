"""Live test against the running local stack, simulating the frontend's calls."""
import json
import os
import sys
import uuid

import httpx

BASE = os.environ.get("TEST_BASE", "http://127.0.0.1:8000")
ORIGIN = os.environ.get("TEST_ORIGIN", "http://localhost:5173")

PASS = 0
FAIL = 0
failures = []


def check(label, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  PASS  {label}")
    else:
        FAIL += 1
        failures.append(label)
        print(f"  FAIL  {label} :: {detail}")


def main():
    c = httpx.Client(base_url=BASE, timeout=60, headers={"Origin": ORIGIN})

    print("\n[CORS] preflight for login")
    r = c.options(
        "/api/v1/auth/login",
        headers={
            "Origin": ORIGIN,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,authorization",
        },
    )
    check("preflight 200", r.status_code in (200, 204), f"{r.status_code}")
    check(
        "allow-origin echoed",
        r.headers.get("access-control-allow-origin") in (ORIGIN, "*"),
        r.headers.get("access-control-allow-origin"),
    )

    email = f"ui_{uuid.uuid4().hex[:8]}@example.com"
    print(f"\n[UI] register {email}")
    r = c.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "UiTestPass#2026", "full_name": "UI Tester"},
    )
    check("register", r.status_code == 200, r.text[:200])
    token = r.json()["access_token"]
    h = {"Authorization": f"Bearer {token}"}

    print("\n[UI] AppShell identity")
    r = c.get("/api/v1/users/me", headers=h)
    check("users/me (AppShell + Profile)", r.status_code == 200 and r.json().get("full_name") == "UI Tester", r.text[:200])

    print("\n[UI] Dashboard parallel calls")
    for name, path in [
        ("applications/stats", "/api/v1/applications/stats"),
        ("applications list", "/api/v1/applications/?limit=5"),
        ("compliance findings", "/api/v1/compliance/findings"),
        ("reports summary", "/api/v1/reports/summary"),
    ]:
        r = c.get(path, headers=h)
        check(name, r.status_code == 200, f"{r.status_code} {r.text[:150]}")

    print("\n[UI] Applications -> create")
    r = c.post(
        "/api/v1/applications/",
        json={
            "organization_name": "UI Test Institute",
            "application_category": "Renewal",
            "applicant_details": {"contact_email": "registrar@uitest.edu"},
        },
        headers=h,
    )
    check("create", r.status_code == 200, r.text[:200])
    app_id = r.json()["id"]

    print("\n[UI] ApplicationDetail load")
    r = c.get(f"/api/v1/applications/{app_id}", headers=h)
    body = r.json() if r.status_code == 200 else {}
    check("detail 200", r.status_code == 200, r.text[:200])
    check("detail has documents list", isinstance(body.get("documents"), list), str(body)[:200])
    check("detail has history list", isinstance(body.get("history"), list), str(body)[:200])
    check("detail has evidence list", isinstance(body.get("evidence_requests"), list), str(body)[:200])
    check("detail has compliance_runs", isinstance(body.get("compliance_runs"), list), str(body)[:200])

    print("\n[UI] Audit for entity")
    r = c.get(f"/api/v1/audit/?entity_type=application&entity_id={app_id}", headers=h)
    check("entity audit", r.status_code == 200, r.text[:200])

    print("\n[UI] ApplicationDetail upload (documentsApi.upload)")
    pdf = b"%PDF-1.4\n% ui test\n1 0 obj<<>>endobj\n%%EOF\n"
    r = c.post(
        "/api/v1/documents/upload",
        files={"file": ("test.pdf", pdf, "application/pdf")},
        data={"application_id": app_id},
        headers=h,
    )
    check("upload", r.status_code == 200, r.text[:300])
    doc_id = r.json().get("id") if r.status_code == 200 else None

    print("\n[UI] Document pages")
    r = c.get("/api/v1/documents/", headers=h)
    check("documents list", r.status_code == 200 and r.json().get("total", 0) >= 1, r.text[:200])
    if doc_id:
        r = c.post(f"/api/v1/documents/{doc_id}/verify", headers=h)
        check(
            "verify (DocumentAuth)",
            r.status_code == 200 and r.json().get("integrity_verified") is True,
            r.text[:250],
        )

    print("\n[UI] Submit")
    r = c.post(f"/api/v1/applications/{app_id}/submit", headers=h)
    check("submit", r.status_code == 200, r.text[:250])

    print("\n[UI] Compliance page")
    r = c.get("/api/v1/compliance/rules", headers=h)
    check("rules", r.status_code == 200 and r.json().get("total", 0) >= 1, r.text[:200])
    r = c.post(f"/api/v1/compliance/run/{app_id}", headers=h)
    check("run", r.status_code == 200, r.text[:250])
    r = c.get("/api/v1/compliance/findings", headers=h)
    check("findings", r.status_code == 200, r.text[:200])

    print("\n[UI] Evidence page")
    r = c.get("/api/v1/evidence/", headers=h)
    check("evidence list (Notifications + EvidenceRequests)", r.status_code == 200, r.text[:200])

    print("\n[UI] Reports + Notifications + Audit")
    r = c.get("/api/v1/reports/summary", headers=h)
    check("reports summary", r.status_code == 200, r.text[:200])
    r = c.get("/api/v1/audit/", headers=h)
    check("audit list", r.status_code == 200 and r.json().get("total", 0) >= 1, r.text[:200])

    print("\n[UI] Admin reviewer flow")
    r = c.post(
        "/api/v1/auth/login",
        json={"email": "admin@verisure.local", "password": os.environ.get("ADMIN_PASSWORD", "change-this-password")},
    )
    if r.status_code == 200:
        ah = {"Authorization": f"Bearer {r.json()['access_token']}"}
        r = c.get("/api/v1/users/me", headers=ah)
        check("admin role", r.json().get("role") == "admin", r.text[:200])
        r = c.patch(f"/api/v1/applications/{app_id}/status", json={"status": "under_review"}, headers=ah)
        check("start review", r.status_code == 200, r.text[:200])
        r = c.post(
            "/api/v1/evidence/",
            json={"application_id": app_id, "message": "Provide audited accounts"},
            headers=ah,
        )
        check("raise evidence", r.status_code == 200, r.text[:200])
        ev_id = r.json().get("id") if r.status_code == 200 else None
        if ev_id:
            r = c.post(f"/api/v1/evidence/{ev_id}/respond", json={"response_notes": "See attached"}, headers=h)
            check("applicant responds", r.status_code == 200, r.text[:200])
        r = c.patch(
            f"/api/v1/applications/{app_id}/status",
            json={"status": "approved", "reason": "Complete"},
            headers=ah,
        )
        check("approve", r.status_code == 200 and r.json().get("status") == "approved", r.text[:200])
    else:
        check("admin login", False, r.text[:200])

    print(f"\n{'=' * 52}\nLIVE PASS: {PASS}   FAIL: {FAIL}\n{'=' * 52}")
    if failures:
        print("Failures:", ", ".join(failures))
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
