"""Secret-excluding source archives and isolated dependency snapshot for T006."""
import argparse
from hashlib import sha256
import importlib.metadata as metadata
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import venv
import zipfile

from packaging.requirements import Requirement
from packaging.utils import canonicalize_name

ROOT = Path(__file__).resolve().parent.parent


def allowed(name):
    path = Path(name)
    if any(p in {".git", "node_modules", "__pycache__", "instance", "uploads", "dist", ".pytest_cache"} for p in path.parts): return False
    if path.name.startswith(".env") and path.name != ".env.example": return False
    if path.suffix.lower() in {".db", ".sqlite", ".sqlite3", ".log", ".csv", ".pem", ".key", ".pfx", ".pyc"}: return False
    if name.startswith(("backend/app/", "backend/migrations/", "backend/tests/", "backend/requirements/")):
        return path.suffix in {".py", ".mako", ".ini", ".txt", ".md", ".html"}
    if name.startswith("frontend/src/"): return path.suffix in {".ts", ".tsx", ".css", ".json", ".svg"}
    if name.startswith("frontend/public/"): return path.suffix in {".svg", ".png", ".jpg", ".webp", ".ico"}
    if name.startswith("docs/"): return path.suffix == ".md"
    if len(path.parts) == 2 and path.parts[0] in {"frontend", "backend"}:
        return path.name in {"package.json", "package-lock.json", "requirements.txt", "README.md", "pytest.ini", "alembic.ini", ".env.example", "index.html", ".gitignore", "vite.config.ts", "tailwind.config.js", "postcss.config.js", "postcss.config.cjs", "tailwind.config.ts"} or path.name.startswith("tsconfig") or (path.parts[0] == "backend" and path.suffix in {".py", ".ps1"})
    return name in {"package.json", "package-lock.json", "README.md", ".gitignore"}


def dependency_snapshot(destination):
    installed = {canonicalize_name(d.metadata["Name"]): d for d in metadata.distributions()}
    names = [Requirement(line).name for line in (ROOT / "backend/requirements.txt").read_text().splitlines() if line.strip() and not line.startswith("#")]
    pending = list(names) + ["pytest", "Pillow", "requests", "packaging", "pip"]
    selected = {}
    missing = []
    while pending:
        name = canonicalize_name(pending.pop())
        if name in selected: continue
        if name not in installed:
            missing.append(name)
            continue
        dist = installed[name]; selected[name] = dist
        for item in dist.requires or []:
            requirement = Requirement(item)
            if requirement.marker is None or requirement.marker.evaluate({"extra": ""}): pending.append(requirement.name)
    venv.EnvBuilder(with_pip=False).create(destination)
    site = destination / "Lib/site-packages"
    copied = {}
    for name, dist in selected.items():
        base = Path(dist.locate_file("")).resolve()
        for entry in dist.files or []:
            source = Path(dist.locate_file(entry)).resolve()
            if not source.is_file() or not source.is_relative_to(base) or "__pycache__" in source.parts: continue
            relative = source.relative_to(base)
            target = site / relative; target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        copied[dist.metadata["Name"]] = dist.version
    python = destination / "Scripts/python.exe"
    unresolved = []
    for name in missing:
        query = subprocess.run([str(python), "-I", "-c", "import importlib.metadata,sys; print(importlib.metadata.version(sys.argv[1]))", name], capture_output=True, text=True)
        if query.returncode == 0: copied[name] = query.stdout.strip()
        else: unresolved.append(name)
    return copied, sorted(set(unresolved))


def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--directory", type=Path, required=True); args = parser.parse_args()
    output = args.directory.resolve()
    if not output.is_relative_to(ROOT / "backend/instance"): raise RuntimeError("Output must be private instance evidence")
    previous = json.loads((ROOT / "backend/instance/utsav_t005_vc3zcmw8/rehearsal.json").read_text())
    mismatched = [name for name, expected in previous["source_manifest"].items() if sha256((ROOT / name).read_bytes()).hexdigest() != expected]
    if mismatched: raise RuntimeError("T005 source changed: " + ", ".join(mismatched))
    filenames = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard"], cwd=ROOT, text=True).splitlines()
    selected = sorted({name for name in filenames if allowed(name) and (ROOT / name).is_file()})
    # Compare prospective content against actual local secret values entirely
    # in memory; never print values or add the .env files to the archive.
    from dotenv import dotenv_values
    secrets = []
    for path in (ROOT / ".env", ROOT / "backend/.env", ROOT / "frontend/.env"):
        if path.exists():
            for key, value in dotenv_values(path).items():
                if re.search("SECRET|PASSWORD|TOKEN|KEY", key) and value and len(value) >= 12 and not value.startswith(("replace-", "test-")):
                    secrets.append(value.encode())
    repaired = output / "repaired-release"; repaired.mkdir(exist_ok=True)
    hashes = {}
    for name in selected:
        data = (ROOT / name).read_bytes()
        if any(secret in data for secret in secrets): raise RuntimeError("Secret match in release candidate: " + name)
        target = repaired / name; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
        hashes[name] = sha256(data).hexdigest()
    dependency_versions, missing = dependency_snapshot(output / "isolated-python")
    if missing:
        (output / "missing-dependencies.json").write_text(json.dumps(missing))
        print(json.dumps({"isolated_environment_prepared": True, "missing_declared_dependencies": missing}))
        return
    lock = "\n".join(name + "==" + version for name, version in sorted(dependency_versions.items(), key=lambda item:item[0].lower())) + "\n"
    (repaired / "backend/requirements.t006.lock.txt").write_bytes(lock.encode())
    hashes["backend/requirements.t006.lock.txt"] = sha256(lock.encode()).hexdigest()
    tracked = subprocess.check_output(["git", "ls-files"], cwd=ROOT, text=True).splitlines()
    patch = subprocess.check_output(["git", "diff", "--binary", "HEAD", "--"] + [p for p in selected if p in tracked], cwd=ROOT)
    if any(secret in patch for secret in secrets): raise RuntimeError("Secret match in working-tree patch")
    (repaired / "WORKING_TREE.patch").write_bytes(patch); hashes["WORKING_TREE.patch"] = sha256(patch).hexdigest()
    manifest = {"git_base": previous["git_commit"], "t005_manifest_verified": True, "files": hashes, "dependencies": dependency_versions, "python": sys.version, "excluded": [".env secrets", "databases", "uploads", "logs", "Git object database", "node_modules", "private records"], "untracked_source_included": [p for p in selected if p not in tracked]}
    (repaired / "RELEASE_MANIFEST.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    archive = output / "utsav-repaired-t005.zip"
    with zipfile.ZipFile(archive, "x", zipfile.ZIP_DEFLATED) as package:
        for path in sorted(repaired.rglob("*")):
            if path.is_file(): package.write(path, path.relative_to(repaired).as_posix())
    summary = {"archive": str(archive), "sha256": sha256(archive.read_bytes()).hexdigest(), "files": len(hashes), "isolated_python": str(output / "isolated-python/Scripts/python.exe"), "dependency_count": len(dependency_versions)}
    (output / "repaired-archive.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__": main()
