// 재외공관 조회 요청을 처리하는 컨트롤러
'use strict'

const { getConsulateByDestination } = require('../services/consulateService')

async function getConsulate(req, res, next) {
  try {
    const { destination } = req.query
    if (!destination) {
      return res.status(400).json({ error: 'destination 파라미터가 필요합니다.' })
    }
    const data = await getConsulateByDestination(destination)
    if (!data) {
      return res.status(404).json({ error: '해당 여행지의 재외공관 정보를 찾을 수 없습니다.' })
    }
    res.json(data)
  } catch (err) {
    next(err)
  }
}

module.exports = { getConsulate }
