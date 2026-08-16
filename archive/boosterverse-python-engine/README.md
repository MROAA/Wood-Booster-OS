# Boosterverse Python engine (archived)

A standalone, ~60-file Python cluster (`core_manager.py` instantiating
~54 "engine" classes, `server.py` as a Flask entrypoint) that nothing
in the live app ever imported or ran.

Read through every file before archiving. Result: almost all of it is
flavor-text - constructors return hardcoded dicts, or methods bump an
in-memory counter and unconditionally report `"success": True`. A few
files (`spacemonkey_wordpress.py`, `spacemonkey_social.py`,
`spacemonkey_gimp.py`, `spacemonkey_media.py`, `spacemonkey_drives.py`,
`windows_filesystem.py`) go further and *simulate* doing something real
(publishing a WordPress post, editing a photo, mounting a drive)
without making any real HTTP/file-system call - each of these already
has a genuine, shipped equivalent elsewhere in this repo
(`server/routes/wordpressStudio.js`, `server/routes/socialStudio.js`,
`server/services/photoEditor.js`, `server/services/videoEditor.js`,
`backend/modules/virtual_storage.py`, `backend/modules/desktop_files.py`).

Three files (`monitor.py`, `system_controller.py`, `knowledge_bank.py`)
are genuinely real (real `psutil` system stats, real JSON persistence)
but duplicate an already-shipped equivalent (System Pulse,
`backend/modules/data_layer.py`).

`brain.py` uses real PyTorch, but constructs a fresh, never-trained
network on every call - its output is mathematically real tensor math
over random noise, not a real decision.

`backend/modules/spacemonkey_core.py` itself explains the intended
architecture: use the real `src/spacemonkey/` core instead of building
a parallel fake-text Python implementation. This cluster is that
parallel implementation, superseded rather than forgotten.

Kept here as-is (not deleted) in case any individual file's approach
is useful reference material later.
