# Example: write an approved Python draft

```bash
# 1. Generate a draft with AI
curl -X POST http://localhost:3001/api/python-drafts \
  -H "Content-Type: application/json" \
  -d '{"useAI": true, "prompt": "write a script that renames files in a folder to lowercase", "filePath": "rename_lowercase.py"}'

# 2. Approve it (draftId from the response above)
curl -X PUT http://localhost:3001/api/python-drafts/1/approve

# 3. Write it to disk
curl -X PUT http://localhost:3001/api/python-drafts/1/write
```

The file lands under `server/generated-python/rename_lowercase.py`.
