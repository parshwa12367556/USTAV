# T006 Windows maintenance runbook — preparation only

No stop/start, live migration, file replacement or restore command in this runbook was executed during T006. Run mutating steps only in a separately authorized maintenance task. This runbook applies to the **observed local Windows development installation**, not an invented production service.

## Verified installation and current identities

At 17:40 IST on 14 November 2026, Restart Manager identified `D:\UTSAV\backend\instance\utsav.db` owners **4492** and **12996**. Both are Python `run.py` processes; 4492 is the parent, launched from PowerShell 4720, and 12996 its child. The parent owns listener `127.0.0.1:5000`. An earlier child, 20988, disappeared and was replaced during inspection; never reuse a stale child PID.

Frontend: node 13840 → cmd 24736 → Vite/node 14692 → esbuild 28656. Vite listens on `[::1]:5173`; its executable/arguments identify this repository. None of those frontend processes was reported as a SQLite file owner. No matching Windows service, scheduled task, current/common startup entry, production WSGI runtime or background worker was identified. No unrelated service/task should be disabled. Source documentation recommending Gunicorn is a deployment example, not evidence it runs here.

## 1. Refresh read-only inventory

From a PowerShell account permitted to query CIM, Task Scheduler and Restart Manager:

```powershell
Set-Location -LiteralPath 'D:\UTSAV'
& '.\backend\t006_inventory.ps1' -OutputDirectory '<private evidence directory>' -NoWrite
Get-CimInstance Win32_Process |
  Where-Object { $_.Name -in @('python.exe','node.exe','esbuild.exe') } |
  Select-Object ProcessId,ParentProcessId,Name,ExecutablePath,CreationDate
Get-NetTCPConnection -State Listen |
  Where-Object { $_.LocalPort -in @(5000,5173) } |
  Select-Object LocalAddress,LocalPort,OwningProcess
```

The script enumerates services, tasks and current/common startup entries, classifies relevant process commands internally, and queries only `RmStartSession`, `RmRegisterResources`, `RmGetList`, `RmEndSession`. It declares/calls **no Restart Manager shutdown/restart API**. It emits no raw process command lines, task arguments or registry values. `-NoWrite` avoids differences between the querying account and private evidence-directory owner; save the sanitized JSON through the approved evidence mechanism.

Restart Manager identifies file users, not whether a particular connection is currently executing a write. Combine it with the known process tree, source entry points and no-writer checks below. Other user profiles, other hosts and future/transient connections are outside this point-in-time inventory.

## 2. Stop only the verified writers — future authorization required

First stop incoming use, drain requests and freeze source changes. In the original backend PowerShell terminal **4720**, use **Ctrl+C** to stop the development server/reloader. Do not kill PowerShell 4720, VS Code, all Python processes or an unrelated application. Stop the parent/reloader as well as its child; stopping only the child can cause another writer to spawn. No additional service/task recovery policy was found to disable.

If graceful stopping does not finish, an authorized operator may use this narrowly bound fallback. **Refresh the JSON first** and compare the PIDs/start times; old evidence is not sufficient:

```powershell
$snapshot = Get-Content -LiteralPath '<fresh writer-inventory.json>' -Raw | ConvertFrom-Json
$owners = @($snapshot.DatabaseOwners.Pid)
$expected = @($snapshot.Processes | Where-Object { $_.Pid -in $owners })
if ($expected.Count -ne 2 -or @($expected | Where-Object { -not $_.RunPy -or $_.Name -ne 'python.exe' }).Count) {
    throw 'Writer identities changed; inspect before stopping anything'
}
# The parent must be one of the same-file owners and the child's recorded parent.
$parent = $expected | Where-Object { $_.Pid -in $expected.ParentPid }
if (@($parent).Count -ne 1) { throw 'Unverified reloader tree' }
$child = $expected | Where-Object { $_.Pid -ne $parent.Pid }
foreach ($entry in @($parent,$child)) {
    $current = Get-CimInstance Win32_Process -Filter "ProcessId=$($entry.Pid)"
    if (-not $current) { continue }
    $recordedMs = ([DateTimeOffset]$entry.Created).ToUnixTimeMilliseconds()
    $actualMs = ([DateTimeOffset]($current.CreationDate.ToUniversalTime())).ToUnixTimeMilliseconds()
    if ($current.Name -ne $entry.Name -or $current.ParentProcessId -ne $entry.ParentPid -or
        $current.ExecutablePath -ne $entry.Executable -or $actualMs -ne $recordedMs) {
        throw 'PID reuse/process change; do not stop this process'
    }
    Stop-Process -Id $entry.Pid -ErrorAction Stop
}
```

This exact parent-first mechanism is prepared from verified identities, **not shutdown-tested**: the task prohibited stopping the real writers. The observed original pair was 4492/20988 and later 4492/12996; the guard deliberately aborts if the tree changes. Wait/reinspect rather than broadening the kill list.

Stopping the frontend is optional for SQLite safety, but Ctrl+C in its original terminal **23000** prevents clients continuing to use a maintenance backend. Do not stop it as though it were a database worker. Keep automatic source reload disabled during validation; do not edit or unpack code into a running watch tree during cutover.

## 3. Prove maintenance quiescence and journal state

Repeat the inventory and require no `DatabaseOwners`, no surviving verified backend tree and no listener on 5000. If new owners appear, identify them and stop; do not assume an empty earlier sample remains valid. With writers stopped and restart mechanisms suppressed, test exclusive file access without writing bytes:

```powershell
$database = 'D:\UTSAV\backend\instance\utsav.db'
$probe = [System.IO.File]::Open($database, [System.IO.FileMode]::Open,
    [System.IO.FileAccess]::Read, [System.IO.FileShare]::None)
$probe.Dispose()
Get-Item -LiteralPath $database | Select-Object FullName,Length,LastWriteTimeUtc
Get-FileHash -LiteralPath $database -Algorithm SHA256
foreach ($suffix in @('-wal','-shm','-journal')) {
    $sidecar = $database + $suffix
    if (Test-Path -LiteralPath $sidecar) { Get-Item -LiteralPath $sidecar | Select-Object FullName,Length,LastWriteTimeUtc }
}
```

The probe was **not run on the live file in T006**; it is a future maintenance check, and it does not by itself prevent later writers. Inspect `PRAGMA journal_mode`, `integrity_check`, `foreign_key_check`, schema/version through read-only SQLite access. The reviewed T005 cutover is for DELETE mode and no sidecars. If WAL/hot journals exist, stop and review preservation/checkpoint/recovery before any replacement. Never delete sidecars as cleanup or attach stale WAL to a replacement. Use SQLite backup, not file-copying a busy database.

## 4. Stage, validate and authorize cutover

1. Confirm a separate authorization, maintenance window, exact source/release manifests, database path and recovery pairing. Preserve original and earlier backups.
2. On the frozen source run `python backend/t005_rehearsal.py`. The host has no live-target option. It creates a new private consistent backup, fully compares baseline `91d2e7a4c631`, stamps **only its stage**, upgrades explicitly to `e5c0a3b7f912`, restores FK enforcement and verifies schema, signatures, integrity, FKs and independent restore stages.
3. Require zero unexpected differences and matching preflight/live hashes immediately before cutover; recheck no writers/sidecars. Validate absolute paths on the same volume and private ownership/ACLs. Do not deploy today's T006 synthetic smoke databases or an old rehearsal snapshot.
4. Follow the exact stage-and-`System.IO.File.Replace` procedure in [T005](../t005-final-migration-rehearsal.md#12-reviewed-live-execution-procedure--not-executed). Its forward/reverse mechanics were tested on disposable files on D:. Recheck deployed account permissions; never overwrite an existing backup pathname.
5. Keep writers stopped until the promoted database has expected final revision/schema, original business signatures, integrity `ok` and no FK violations. Keep complete incident evidence on any failure.

Do not use the generic guide's `flask --app run db upgrade` against the unstamped original. Default factory startup can create tables or attempt stamping under other schema states, and the reconciliation migration requires the verified maintenance FK procedure.

## 5. Start the verified release pair — future authorization required

Extract the verified repaired archive to a dedicated release directory, install its pinned requirements in the approved interpreter environment, and verify its manifest. Keep `backend/.env` secrets outside the archive; inject them from the approved protected configuration. The observed development interpreter is `C:\Users\Parsh\AppData\Local\Programs\Python\Python314\python.exe` and the tested isolated snapshot is Python 3.14 with 44 pinned distributions. No production WSGI service is configured to restart.

For initial local validation, use an explicit release/database binding with reload/debug disabled. The following code is a **future launch recipe**, not something executed on the original during T006:

```powershell
$env:UTSAV_RELEASE_BACKEND = '<verified repaired release>\backend'
$env:UTSAV_EXPECTED_REVISION = 'e5c0a3b7f912'
$launch = @'
import os, pathlib, sqlite3, sys
backend = pathlib.Path(os.environ["UTSAV_RELEASE_BACKEND"]).resolve()
database = pathlib.Path("D:/UTSAV/backend/instance/utsav.db")
with sqlite3.connect(database.as_uri()+"?mode=ro", uri=True) as c:
    assert c.execute("SELECT version_num FROM alembic_version").fetchall() == [(os.environ["UTSAV_EXPECTED_REVISION"],)]
sys.path.insert(0, str(backend))
from dotenv import load_dotenv
load_dotenv("D:/UTSAV/backend/.env")
from app import create_app
application = create_app("development", {
    "SQLALCHEMY_DATABASE_URI": "sqlite:///"+database.as_posix(),
    "AUTO_INIT_DATABASE": False,
    "UPLOAD_FOLDER": "D:/UTSAV/backend/uploads",
})
application.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
'@
& '<approved release interpreter>\python.exe' -I -c $launch
```

This starts the same **application/server class and port** observed locally, with the safety-relevant deliberate change of disabling the development reloader/debugger. It is not a claim that Flask development serving is production hosting. Launch correctness was tested through the factory/test client on isolated pairs, not by restarting this live listener. After validation, any decision to resume a debug/reload workflow must be explicit and kept outside the maintenance window.

Frontend, if stopped, can be resumed from its verified matching release:

```powershell
Push-Location -LiteralPath '<verified release>\frontend'
npm.cmd run dev
Pop-Location
```

No frontend command, Windows service start, Task Scheduler action or backend network-listener launch was executed in T006.

## 6. Monitor and decide recovery

After the separately authorized launch:

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:5000/health'
Invoke-RestMethod -Uri 'http://127.0.0.1:5000/api/v1/health'
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -eq 5000 } |
    Select-Object LocalAddress,LocalPort,OwningProcess
```

Review the launch terminal/application error destination without copying tokens or private request bodies into reports. Check authorized read-only business flows, final schema/version, error rate and matching frontend/auth contract. Do not insert demo records into the live database as a smoke test.

If startup, schema, authentication or business verification fails, stop the newly identified writers and preserve the failed DB/logs/sidecars. Recover the **database and matching release together**: verified pre-migration baseline restore plus `21b4dd72f1808992696ec4307d47ed21b5abc40d`, not current code plus baseline DB. The baseline fixture deliberately retained its original empty Alembic version rows; do not force-stamp it during recovery merely to satisfy current startup expectations.

The historical release lacks newer session/MFA/security-version and hashed guest/share-token protections. Treat rollback as a time-bounded, restricted recovery mode, not security equivalence. Revoke access by rotating JWT signing material through protected configuration before exposing the old authentication stack; its old verifier does not enforce current session/security-version claims. Keep public guest endpoints and general access restricted pending incident/security review. Do not print new keys or copy secrets into the source archive.

Never downgrade the token migration: hashes cannot reconstruct original tokens and its downgrade generates different links. Restore only under the separate approved incident procedure, preserving evidence and accounting for data created since the backup. Retain private snapshots according to the approved access/retention policy.

## Cutover checklist

- [ ] Separate authorization and maintenance window recorded; local-host scope confirmed.
- [ ] Fresh inventory, process start times, owners and listener identities verified.
- [ ] Backend parent and child stopped; no reloader, worker, scheduled restart or new owner remains.
- [ ] Exclusive-open, stable source hash, DELETE/no-sidecar preconditions verified.
- [ ] New SQLite-consistent private backup and full baseline schema comparison pass.
- [ ] Frozen stage reaches exact `e5c0a3b7f912`; no moving HEAD; data/schema/integrity/FK checks pass.
- [ ] Independent restore stage and same-volume replacement/ACL requirements verified.
- [ ] Repaired and rollback archives/manifests, matching frontend/configuration and interpreter prepared.
- [ ] Replacement separately authorized; unique old/failed DB backup paths reserved.
- [ ] Correct paired release starts without implicit migration or reloader; health/business checks pass.
- [ ] Rollback stop/preserve/restore/release/key-rotation/restricted-access decision reviewed.
- [ ] Logs, backup custody, expiry and monitoring responsibilities recorded.
