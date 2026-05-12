// 여행 메모리(사진+메모) 라우트
const { Router } = require('express')
const requireAuth = require('../middlewares/requireAuth')
const { upload, uploadPhoto, saveMemory, getAlbums } = require('../controllers/memoryController')

const router = Router()

router.get('/memories/albums', requireAuth, getAlbums)
router.post('/memories/upload', upload.single('photo'), uploadPhoto)
router.post('/memories', requireAuth, saveMemory)

module.exports = router
