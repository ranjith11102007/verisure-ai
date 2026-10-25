"""End-to-end smoke test for the VeriSure AI API.

Run from backend/ with DATABASE_URL pointing at a reachable Postgres:
    python smoke_test.py
"""
import io
import os
import sys
import uuid

from fastapi.testclient import TestClient

from app.main import app

PASS = 0
FAIL = 0


def check(label, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  PASS  {label}")
    else:
        FAIL += 1
        print(f"  FAIL  {label} {detail}")


def main() -> int:
    with TestClient(app) as client:
        email = f"smoke_{uuid.uuid4().hex[:8]}@example.com"
        password = "SmokeTest#2026"

        print("\n[1] Health")
        r = client.get("/api/health")
        check("health endpoint", r.status_code == 200, r.text)

        print("\n[2] Register")
        r = client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": password, "full_name": "Smoke Tester"},
        )
        check("register", r.status_code == 200, r.text)
        token = r.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}

        print("\n[3] Identity")
        r = client.get("/api/v1/auth/me", headers=headers)
        check("auth/me", r.status_code == 200, r.text)

        r = client.patch(
            "/api/v1/users/me", json={"full_name": "Smoke Tester II"}, headers=headers
        )
        check("users/me patch", r.status_code == 200, r.text)

        print("\n[4] Applications")
        r = client.post(
            "/api/v1/applications/",
            json={
                "organization_name": "Smoke Institute of Technology",
                "application_category": "New Establishment",
                "applicant_details": {"contact_email": "registrar@smoke.edu"},
            },
            headers=headers,
        )
        check("create application", r.status_code == 200, r.text)
        app_id = r.json().get("id")

        r = client.get("/api/v1/applications/", headers=headers)
        check("list applications", r.status_code == 200 and r.json().get("total", 0) >= 1, r.text)

        r = client.get("/api/v1/applications/stats", headers=headers)
        check("application stats", r.status_code == 200, r.text)

        r = client.get(f"/api/v1/applications/{app_id}", headers=headers)
        check("get application", r.status_code == 200, r.text)

        print("\n[5] Submit without documents (should be rejected)")
        r = client.post(f"/api/v1/applications/{app_id}/submit", headers=headers)
        check("submit blocked without docs", r.status_code == 400, r.text)

        print("\n[6] Documents")
        pdf_bytes = b"%PDF-1.4\n% smoke test document\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"
        r = client.post(
            "/api/v1/documents/upload",
            files={"file": ("evidence.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
            data={"application_id": app_id},
            headers=headers,
        )
        check("upload document", r.status_code == 200, r.text)
        doc_id = r.json().get("id")

        r = client.post(
            "/api/v1/documents/upload",
            files={"file": ("evidence.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
            data={"application_id": app_id},
            headers=headers,
        )
        check("duplicate rejected", r.status_code == 400, r.text)

        r = client.get("/api/v1/documents/", headers=headers)
        check("list documents", r.status_code == 200 and r.json().get("total", 0) >= 1, r.text)

        r = client.post(f"/api/v1/documents/{doc_id}/verify", headers=headers)
        check("verify integrity", r.status_code == 200 and r.json().get("integrity_verified"), r.text)

        print("\n[7] Submit after documents")
        r = client.post(f"/api/v1/applications/{app_id}/submit", headers=headers)
        check("submit application", r.status_code == 200, r.text)

        r = client.get(f"/api/v1/applications/{app_id}/history", headers=headers)
        check("status history", r.status_code == 200 and len(r.json().get("history", [])) >= 2, r.text)

        print("\n[8] Compliance")
        r = client.get("/api/v1/compliance/rules", headers=headers)
        check("list rules", r.status_code == 200 and r.json().get("total", 0) >= 1, r.text)

        r = client.post(f"/api/v1/compliance/run/{app_id}", headers=headers)
        check("run compliance", r.status_code == 200, r.text)

        r = client.get("/api/v1/compliance/findings", headers=headers)
        check("list findings", r.status_code == 200, r.text)

        print("\n[9] Evidence requests (reviewer-only create)")
        r = client.post(
            "/api/v1/evidence/",
            json={"application_id": app_id, "message": "Provide ownership proof"},
            headers=headers,
        )
        check("applicant cannot request evidence", r.status_code == 403, r.text)

        r = client.get("/api/v1/evidence/", headers=headers)
        check("list evidence", r.status_code == 200, r.text)

        print("\n[10] Audit and reports")
        r = client.get("/api/v1/audit/", headers=headers)
        check("audit trail", r.status_code == 200 and r.json().get("total", 0) >= 1, r.text)

        r = client.get("/api/v1/reports/summary", headers=headers)
        check("reports summary", r.status_code == 200, r.text)

        print("\n[11] Admin flow")
        r = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@verisure.local", "password": os.environ.get("ADMIN_PASSWORD", "change-this-password")},
        )
        if r.status_code == 200:
            check("admin login", True)
            admin_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

            r = client.patch(
                f"/api/v1/applications/{app_id}/status",
                json={"status": "under_review"},
                headers=admin_headers,
            )
            check("admin moves to review", r.status_code == 200, r.text)

            r = client.post(
                "/api/v1/evidence/",
                json={"application_id": app_id, "message": "Provide ownership proof"},
                headers=admin_headers,
            )
            check("admin requests evidence", r.status_code == 200, r.text)

            r = client.patch(
                f"/api/v1/applications/{app_id}/status",
                json={"status": "approved", "reason": "All requirements met"},
                headers=admin_headers,
            )
            check("admin approves", r.status_code == 200, r.text)
        else:
            print(f"  SKIP  admin login failed ({r.status_code}): {r.text}")

    print(f"\n{'=' * 50}\nPASS: {PASS}   FAIL: {FAIL}\n{'=' * 50}")
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
