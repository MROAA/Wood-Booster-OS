import express from "express"
import cors from "cors"

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get("/api/health", (request, response) => {
  response.json({
    status: "ok",
    service: "Wood-Booster Server",
    message: "API toimii",
  })
})

app.get("/api/projects", (request, response) => {
  response.json([])
})

app.listen(PORT, () => {
  console.log("Wood-Booster Server käynnissä osoitteessa http://localhost:" + PORT)
})
