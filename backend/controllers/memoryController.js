// 여행 사진 업로드 및 메모리 저장 컨트롤러
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const pool = require('../config/database')

// uploads/memories 디렉토리 자동 생성
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'memories')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'))
  },
})

// POST /api/memories/upload — 파일 저장 후 URL 반환
async function uploadPhoto(req, res) {
  if (!req.file) return res.status(400).json({ error: '이미지 파일이 필요합니다.' })
  const url = `/uploads/memories/${req.file.filename}`
  res.json({ url })
}

// POST /api/memories — photobook_albums + travel_memories INSERT
async function saveMemory(req, res) {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: '로그인이 필요합니다.' })

  const { photoUrl, memo, locationName, dayNum, destination, planId } = req.body

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // 같은 유저 + destination 앨범이 있으면 재사용, 없으면 생성
    const dest = destination || '내 여행'
    const [[existing]] = await conn.query(
      'SELECT id FROM photobook_albums WHERE user_id = ? AND destination = ? ORDER BY created_at DESC LIMIT 1',
      [userId, dest]
    )

    let albumId
    if (existing) {
      albumId = existing.id
      if (memo) await conn.query('UPDATE photobook_albums SET memo = ? WHERE id = ?', [memo, albumId])
    } else {
      const [result] = await conn.query(
        'INSERT INTO photobook_albums (user_id, plan_id, title, destination, memo) VALUES (?, ?, ?, ?, ?)',
        [userId, planId || null, dest, dest, memo || null]
      )
      albumId = result.insertId
    }

    // travel_memories INSERT
    const [[lastPage]] = await conn.query(
      'SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM travel_memories WHERE album_id = ?',
      [albumId]
    )
    const sortOrder = (lastPage?.max_order ?? -1) + 1

    const [memResult] = await conn.query(
      `INSERT INTO travel_memories
         (user_id, album_id, plan_id, day_index, sort_order, photo_url, subtitle, caption, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        albumId,
        planId || null,
        dayNum || 1,
        sortOrder,
        photoUrl || null,
        locationName || null,
        memo || null,
        locationName || null,
      ]
    )

    await conn.commit()
    res.json({ memoryId: memResult.insertId, albumId })
  } catch (err) {
    await conn.rollback()
    console.error('saveMemory error:', err)
    res.status(500).json({ error: '저장에 실패했습니다.' })
  } finally {
    conn.release()
  }
}

// GET /api/memories/albums — 로그인 유저의 앨범 목록 + 페이지 조회
async function getAlbums(req, res) {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: '로그인이 필요합니다.' })

  const [albums] = await pool.query(
    'SELECT * FROM photobook_albums WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  )

  const result = await Promise.all(albums.map(async album => {
    const [pages] = await pool.query(
      'SELECT * FROM travel_memories WHERE album_id = ? ORDER BY sort_order ASC',
      [album.id]
    )
    return { ...album, pages }
  }))

  res.json(result)
}

module.exports = { upload, uploadPhoto, saveMemory, getAlbums }
