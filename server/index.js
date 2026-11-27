import express from 'express'

const app = express()
const port = 8787

app.get('/api/health', (_request, response) => {
  response.json({ ok: true })
})

app.listen(port, (error) => {
  if (error) throw error
  console.log(`API listening on http://localhost:${port}`)
})
