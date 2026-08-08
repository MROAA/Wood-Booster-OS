# write-python flow

1. `POST /api/python-drafts` `{ useAI: true, prompt: "..." }` — luo
   `PythonCodeDraft`in `status: "draft"`, `generatePythonDraft()`
   kutsuu Ollamaa (`server/services/pythonCodeGenerator.js`) ja
   täyttää `title`/`code`. Manuaalinen `title`/`code`/`filePath` käy
   myös ilman `useAI`:ta.
2. Ihminen muokkaa `code`/`filePath`/`title` tarpeen mukaan:
   `PUT /api/python-drafts/:id`.
3. Ihminen hyväksyy: `PUT /api/python-drafts/:id/approve` →
   `status: "approved"`.
4. Ihminen kirjoittaa levylle: `PUT /api/python-drafts/:id/write` —
   reitti hylkää ellei `status === "approved"`, muuten kutsuu
   `workflowEngine.execute("write-python-workflow", { draftId, prisma, toolBus })`.
5. `writePythonCodeSkill` ratkaisee turvallisen polun
   `server/generated-python/`-hakemiston sisään, kutsuu File Toolia
   (`mkdir` + `write`), palauttaa `filePath`.
6. Reitti päivittää luonnoksen: onnistuessa `status: "written"` +
   `writtenAt`, epäonnistuessa `status: "write_failed"` +
   `writeError`.
