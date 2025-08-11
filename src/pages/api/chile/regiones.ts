import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const resp = await fetch('https://apis.digital.gob.cl/dpa/regiones')
    if (!resp.ok) {
      return res.status(resp.status).end()
    }
    const data = await resp.json()
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
    res.status(200).json(data)
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error interno' })
  }
}
