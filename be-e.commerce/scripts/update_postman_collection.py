import json
from pathlib import Path


COLLECTION_PATH = Path("ECommerce_API_Collection.postman_collection.json")


def ensure_variable(collection: dict, key: str, default_value: str) -> None:
    variables = collection.setdefault("variable", [])
    for var in variables:
        if isinstance(var, dict) and var.get("key") == key:
            return
    variables.append({"key": key, "value": default_value, "type": "string"})


def make_raw_request(
    name: str,
    method: str,
    raw_url: str,
    *,
    body: str | None = None,
    headers: list[dict] | None = None,
    auth: dict | None = None,
    tests: list[str] | None = None,
) -> dict:
    request: dict = {
        "method": method,
        "header": headers or [],
        "url": {"raw": raw_url},
    }
    if body is not None:
        request["body"] = {"mode": "raw", "raw": body}
    if auth is not None:
        request["auth"] = auth

    item: dict = {"name": name, "request": request}
    if tests:
        item["event"] = [
            {
                "listen": "test",
                "script": {"type": "text/javascript", "exec": tests},
            }
        ]
    return item


def upsert_folder(collection: dict, folder: dict, *, after: str | None = None) -> None:
    items = collection.setdefault("item", [])
    for idx, it in enumerate(items):
        if isinstance(it, dict) and it.get("name") == folder.get("name"):
            items[idx] = folder
            return

    if after:
        for idx, it in enumerate(items):
            if isinstance(it, dict) and it.get("name") == after:
                items.insert(idx + 1, folder)
                return
    items.append(folder)


def main() -> None:
    collection = json.loads(COLLECTION_PATH.read_text(encoding="utf-8"))

    # Collection-level variables
    ensure_variable(collection, "admin_jwt_token", "")
    ensure_variable(collection, "admin_email", "admin@example.com")
    ensure_variable(collection, "admin_password", "P@ssw0rd123")
    ensure_variable(collection, "admin_invite_token", "")
    ensure_variable(collection, "ban_user_id", "")
    ensure_variable(collection, "permission_action", "admin:users.read")

    base = "{{base_url}}"

    admin_folder = {
        "name": "Admin",
        "item": [
            make_raw_request(
                "Admin Login",
                "POST",
                f"{base}/api/admin/login",
                headers=[{"key": "Content-Type", "value": "application/json"}],
                body=(
                    "{\n"
                    '  "email": "{{admin_email}}",\n'
                    '  "password": "{{admin_password}}",\n'
                    '  "token": "{{admin_invite_token}}"\n'
                    "}"
                ),
                auth={"type": "noauth"},
                tests=[
                    "pm.test('Status is 200', function () { pm.response.to.have.status(200); });",
                    "let data = {}; try { data = pm.response.json(); } catch (e) {}",
                    "const token = data.token || (data.data && data.data.token) || (data.result && data.result.token);",
                    "if (token) { pm.collectionVariables.set('admin_jwt_token', token); }",
                ],
            ),
            make_raw_request(
                "Create Admin Invite",
                "POST",
                f"{base}/api/admin/create",
                headers=[{"key": "Content-Type", "value": "application/json"}],
                body=("{\n" '  "name": "Admin A",\n' '  "email": "new-admin@example.com"\n' "}"),
                auth={
                    "type": "bearer",
                    "bearer": [{"key": "token", "value": "{{admin_jwt_token}}", "type": "string"}],
                },
            ),
            make_raw_request(
                "Verify Admin",
                "POST",
                f"{base}/api/admin/verify",
                headers=[{"key": "Content-Type", "value": "application/json"}],
                body=(
                    "{\n"
                    '  "email": "new-admin@example.com",\n'
                    '  "token": "{{admin_invite_token}}",\n'
                    '  "password": "{{admin_password}}"\n'
                    "}"
                ),
                auth={
                    "type": "bearer",
                    "bearer": [{"key": "token", "value": "{{admin_jwt_token}}", "type": "string"}],
                },
            ),
            make_raw_request(
                "Ban User",
                "POST",
                f"{base}/api/admin/ban-user",
                headers=[{"key": "Content-Type", "value": "application/json"}],
                body=("{\n" '  "userId": "{{ban_user_id}}"\n' "}"),
                auth={
                    "type": "bearer",
                    "bearer": [{"key": "token", "value": "{{admin_jwt_token}}", "type": "string"}],
                },
            ),
        ],
    }

    permissions_folder = {
        "name": "Permissions",
        "item": [
            make_raw_request(
                "Check Action Permission",
                "POST",
                f"{base}/api/permissions/check",
                headers=[{"key": "Content-Type", "value": "application/json"}],
                body=(
                    "{\n"
                    '  "userId": "{{user_id}}",\n'
                    '  "action": "{{permission_action}}"\n'
                    "}"
                ),
            )
        ],
    }

    upsert_folder(collection, admin_folder, after="Authentication")
    upsert_folder(collection, permissions_folder, after="Admin")

    COLLECTION_PATH.write_text(json.dumps(collection, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()

