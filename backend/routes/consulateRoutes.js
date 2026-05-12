// 재외공관 정보 조회 라우트
'use strict'

const { Router } = require('express')
const { getConsulate } = require('../controllers/consulateController')

const router = Router()
router.get('/consulate', getConsulate)

module.exports = router
