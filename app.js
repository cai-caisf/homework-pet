(() => {
  'use strict'

  const STORAGE_KEY = 'homework-pet-web-v1'
  const CATALOG = [
    { id: 'dog', species: '狗狗', name: '小狗', nameBase: '团团', emoji: '🐶', intro: '活泼热情，最爱陪你散步', price: 80, art: 'dog' },
    { id: 'cat', species: '猫咪', name: '小猫', nameBase: '咪咪', emoji: '🐱', intro: '软软糯糯，喜欢晒太阳', price: 80, art: 'cat' },
    { id: 'rabbit', species: '兔兔', name: '小兔', nameBase: '跳跳', emoji: '🐰', intro: '蹦蹦跳跳，喜欢胡萝卜', price: 60, art: 'rabbit' }
  ]
  const FOOD_PRICE = 20
  const SUPPLY_PRICE = 50
  const TOY_HAPPINESS = 20
  const SNACK_SATIETY = 25
  const PET_SUPPLIES = {
    dog: { toy: '骨头响响玩具', snack: '骨头饼干', play: '抱住小骨头，摇摇尾巴真开心～', eat: '咔嚓咔嚓，骨头饼干真香～' },
    cat: { toy: '毛线球', snack: '小鱼饼干', play: '扑一扑，毛线球别跑呀～', eat: '喵呜，小鱼饼干真好吃～' },
    rabbit: { toy: '萝卜滚滚球', snack: '鲜嫩菜叶', play: '蹦蹦跳跳，推一推萝卜球～', eat: '嚼一嚼，菜叶脆脆甜甜～' }
  }
  const TRIP_DURATION = 12000
  const OUTINGS = {
    park: { cost: 10, name: '公园散步', place: '公园', icon: '🌳', happiness: 18 },
    playground: { cost: 20, name: '宠物乐园', place: '宠物乐园', icon: '🎠', happiness: 26 }
  }
  const main = document.querySelector('#main-view')
  const topPoints = document.querySelector('#top-points')
  const toast = document.querySelector('#toast')
  const importFile = document.querySelector('#import-file')
  const cameraInput = document.querySelector('#task-camera-input')
  const photoInput = document.querySelector('#task-photo-input')
  const photoViewer = document.querySelector('#photo-viewer')
  const actionDialog = document.querySelector('#action-dialog')
  const PARENT_GUARD_KEY = 'homework-pet-parent-guard-v1'
  const MAX_BONUS = 1000
  const viewerImage = document.querySelector('#viewer-image')
  const viewerStage = document.querySelector('#viewer-stage')
  const MAX_TASK_PHOTOS = 6
  const photoUrls = new Map()
  let photoDbPromise
  let taskDraft = newTaskDraft()
  let selectedTaskDate = localDateKey()
  let observedTaskToday = localDateKey()
  let taskWindowTimer = 0
  let draftPhotos = []
  let processingPhotos = false
  let savingTask = false
  let backupBusy = false
  let viewerPhotos = []
  let viewerIndex = 0
  let viewerZoom = 1
  let viewerRequest = 0
  let viewerOpener = null
  let currentView = 'home'
  let toastTimer = 0
  let activePetId = ''
  let petAnimation = null
  let petAnimationTimer = 0
  let petSleepTimer = 0
  let observedPetSleep = isPetSleeping()
  let dialogFlow = null
  let dialogOpener = null
  let parentGateTimer = 0

  const emptySupplies = () => Object.fromEntries(CATALOG.map(item => [item.id, { toy: false, snacks: 0 }]))
  const emptyState = () => ({ points: 0, tasks: [], pets: [], food: 0, supplies: emptySupplies(), activityLog: [], bonusRewards: [] })
  const makeId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      const normalized = normalizeState(saved)
      if (saved && Array.isArray(saved.tasks) && saved.tasks.some(task => !isValidDateKey(task?.scheduledDate))) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)) } catch (_) { /* Keep readable records even if migration cannot be saved. */ }
      }
      return normalized
    } catch (_) {
      return emptyState()
    }
  }

  function normalizeState(saved) {
    if (!saved || typeof saved !== 'object') return emptyState()
    return {
        points: nonNegativeInt(saved.points),
        tasks: Array.isArray(saved.tasks) ? saved.tasks.filter(item => item && typeof item.title === 'string').map(item => ({
          id: String(item.id || makeId()), title: item.title.slice(0, 60), subject: typeof item.subject === 'string' ? item.subject.slice(0, 30) : '',
          reward: isValidReward(item.reward) ? Number(item.reward) : 10, completed: Boolean(item.completed), completedAt: String(item.completedAt || ''), icon: '📚',
          scheduledDate: isValidDateKey(item.scheduledDate) ? item.scheduledDate : localDateKey(),
          timeWindow: validTimeWindow(item.timeWindow) ? { start: item.timeWindow.start, end: item.timeWindow.end } : null,
          photos: Array.isArray(item.photos) ? item.photos.filter(photo => photo && typeof photo.id === 'string').slice(0, MAX_TASK_PHOTOS).map(photo => ({ id: photo.id, name: typeof photo.name === 'string' ? photo.name.slice(0, 100) : '作业照片' })) : []
        })) : [],
        pets: Array.isArray(saved.pets) ? saved.pets.filter(item => item && typeof item.name === 'string').map(item => ({
          id: String(item.id || makeId()), species: String(item.species || '宠物'), name: item.name.slice(0, 20), emoji: String(item.emoji || '🐾'),
          happiness: clamp(item.happiness, 0, 100, 72), satiety: clamp(item.satiety, 0, 100, 75), playCount: nonNegativeInt(item.playCount)
        })) : [],
        food: nonNegativeInt(saved.food),
        supplies: Object.fromEntries(CATALOG.map(item => [item.id, { toy: saved.supplies?.[item.id]?.toy === true, snacks: nonNegativeInt(saved.supplies?.[item.id]?.snacks) }])),
        activityLog: Array.isArray(saved.activityLog) ? saved.activityLog.filter(item => item && typeof item.message === 'string').slice(0, 20).map(item => ({ id: String(item.id || makeId()), message: item.message.slice(0, 120), stamp: String(item.stamp || '') })) : [],
        bonusRewards: Array.isArray(saved.bonusRewards) ? saved.bonusRewards.filter(item => item && isValidReward(item.points) && Number(item.points) <= MAX_BONUS && typeof item.reason === 'string').slice(0, 100).map(item => ({ id: String(item.id || makeId()), points: Number(item.points), reason: item.reason.slice(0, 60), stamp: String(item.stamp || '') })) : []
    }
  }

  let state = loadState()
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      return true
    } catch (_) {
      showToast('浏览器存储空间不足，请先下载备份')
      return false
    }
  }

  function nonNegativeInt(value) {
    const number = Number(value)
    return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0
  }
  function isValidReward(value) {
    const number = Number(value)
    return Number.isSafeInteger(number) && number > 0
  }
  function clamp(value, min, max, fallback) {
    const number = Number(value)
    return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : fallback
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
  }

  function newTaskDraft() {
    return { title: '', subject: '', reward: '10', scheduledDate: '', extraDates: [], timeRestricted: false, startTime: '18:00', endTime: '21:00' }
  }
  function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  function isValidDateKey(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && localDateKey(new Date(`${value}T12:00:00`)) === value
  }
  function addDateDays(key, days) {
    const date = new Date(`${key}T12:00:00`)
    date.setDate(date.getDate() + days)
    return localDateKey(date)
  }
  function weekDates(key) {
    const day = new Date(`${key}T12:00:00`).getDay()
    const monday = addDateDays(key, -((day + 6) % 7))
    return Array.from({ length: 7 }, (_, index) => addDateDays(monday, index))
  }
  function taskDateLabel(key) {
    return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'long' }).format(new Date(`${key}T12:00:00`))
  }
  function validTimeWindow(value) {
    return value && typeof value === 'object' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.start) && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.end) && value.start !== value.end
  }
  function taskTimeBounds(task) {
    if (!validTimeWindow(task.timeWindow)) return null
    const { start, end } = task.timeWindow
    return { start: new Date(`${task.scheduledDate}T${start}:00`).getTime(), end: new Date(`${end < start ? addDateDays(task.scheduledDate, 1) : task.scheduledDate}T${end}:00`).getTime() }
  }
  function taskAvailability(task, now = new Date()) {
    const bounds = taskTimeBounds(task)
    if (!bounds) return { allowed: true, status: 'open', button: `完成打卡 +${task.reward}`, message: '不限时间，完成后确认打卡即可领取积分' }
    const windowLabel = `${taskDateLabel(task.scheduledDate)} ${task.timeWindow.start}–${task.timeWindow.end < task.timeWindow.start ? '次日 ' : ''}${task.timeWindow.end}`
    if (now.getTime() < bounds.start) return { allowed: false, status: 'upcoming', button: '未到时间', message: `尚未开始，仅限 ${windowLabel}` }
    if (now.getTime() >= bounds.end) return { allowed: false, status: 'expired', button: '已错过时间', message: `已错过打卡时间：${windowLabel}` }
    return { allowed: true, status: 'open', button: `完成打卡 +${task.reward}`, message: `可打卡时间：${windowLabel}（结束后不可补打卡）` }
  }
  function refreshTaskAvailability() {
    const tasks = new Map(state.tasks.map(task => [task.id, task]))
    document.querySelectorAll('[data-action="complete-task"]').forEach(button => {
      const task = tasks.get(button.dataset.id)
      if (!task || task.completed) return
      const availability = taskAvailability(task)
      button.disabled = !availability.allowed
      button.textContent = availability.button
      const message = button.closest('.task-card')?.querySelector('.task-availability')
      if (message) { message.textContent = availability.message; message.dataset.status = availability.status }
    })
    document.querySelectorAll('[data-preview-id]').forEach(label => {
      const task = tasks.get(label.dataset.previewId)
      if (!task) return
      const status = task.completed ? '已经完成' : taskAvailability(task).status === 'expired' ? '已错过时间' : taskAvailability(task).status === 'upcoming' ? '未到时间' : '等待打卡'
      label.textContent = `${task.subject || '今日任务'} · ${status}`
    })
    scheduleTaskWindowCheck()
  }
  function scheduleTaskWindowCheck() {
    clearTimeout(taskWindowTimer)
    const now = Date.now()
    const boundaries = state.tasks.filter(task => !task.completed).flatMap(task => { const bounds = taskTimeBounds(task); return bounds ? [bounds.start, bounds.end].filter(value => value > now) : [] })
    if (boundaries.length) taskWindowTimer = setTimeout(refreshTaskAvailability, Math.min(2147483647, Math.max(50, Math.min(...boundaries) - now + 25)))
  }
  function selectTaskDate(key) {
    if (!isValidDateKey(key) || savingTask) return
    selectedTaskDate = key
    if (!taskDraft.title.trim() && !draftPhotos.length) { taskDraft.scheduledDate = key; taskDraft.extraDates = [] }
    render()
  }
  function chooseAssignmentDays(count) {
    if (savingTask) return
    const dates = weekDates(taskDraft.scheduledDate || selectedTaskDate).slice(0, count)
    taskDraft.scheduledDate = dates[0]
    taskDraft.extraDates = dates.slice(1)
    render()
  }
  function syncTaskCalendar() {
    const today = localDateKey()
    if (today !== observedTaskToday) {
      const previous = observedTaskToday
      observedTaskToday = today
      if (selectedTaskDate === previous && !taskDraft.title.trim() && !draftPhotos.length) { selectedTaskDate = today; taskDraft.scheduledDate = ''; taskDraft.extraDates = [] }
      if (currentView === 'home' || (currentView === 'tasks' && !taskDraft.title.trim() && !draftPhotos.length)) render()
    }
    refreshTaskAvailability()
  }

  function openPhotoDb() {
    if (!photoDbPromise) {
      photoDbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open('homework-pet-photos-v1', 1)
        request.onupgradeneeded = () => request.result.createObjectStore('photos', { keyPath: 'id' })
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }).catch(error => { photoDbPromise = null; throw error })
    }
    return photoDbPromise
  }
  async function writePhotoRecords(records, removeIds = []) {
    if (!records.length && !removeIds.length) return
    const db = await openPhotoDb()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('photos', 'readwrite')
      const store = transaction.objectStore('photos')
      records.forEach(record => store.put({ id: record.id, name: record.name, blob: record.blob }))
      removeIds.forEach(id => store.delete(id))
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error || new Error('照片保存中断'))
    })
  }
  async function readPhoto(id) {
    const db = await openPhotoDb()
    return new Promise((resolve, reject) => {
      const request = db.transaction('photos', 'readonly').objectStore('photos').get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  async function photoUrl(id) {
    if (photoUrls.has(id)) return photoUrls.get(id)
    const record = await readPhoto(id)
    if (!record?.blob) return null
    if (!photoUrls.has(id)) photoUrls.set(id, URL.createObjectURL(record.blob))
    return photoUrls.get(id)
  }
  function releasePhotoUrls() {
    photoUrls.forEach(url => URL.revokeObjectURL(url))
    photoUrls.clear()
  }
  function referencedPhotoIds(source = state) {
    return [...new Set(source.tasks.flatMap(task => task.photos.map(photo => photo.id)))]
  }
  async function compressPhoto(file) {
    const source = URL.createObjectURL(file)
    try {
      const image = new Image()
      image.src = source
      await image.decode()
      const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      const context = canvas.getContext('2d')
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .86))
      if (!blob) throw new Error('照片处理失败')
      return { id: makeId(), name: file.name || '作业照片.jpg', blob, url: URL.createObjectURL(blob) }
    } finally {
      URL.revokeObjectURL(source)
    }
  }
  function renderDraftPhotos() {
    const container = document.querySelector('#draft-photos')
    if (!container) return
    container.innerHTML = draftPhotos.map((photo, index) => `<div class="draft-photo-card"><button type="button" class="draft-photo-preview" data-action="preview-draft-photo" data-id="${escapeHtml(photo.id)}" aria-label="放大待添加的作业照片 ${index + 1}"><img src="${escapeHtml(photo.url)}" alt="待添加的作业照片 ${index + 1}"></button><button type="button" class="remove-photo" data-action="remove-draft-photo" data-id="${escapeHtml(photo.id)}" aria-label="移除作业照片 ${index + 1}">×</button></div>`).join('')
    document.querySelector('#photo-selection-status').textContent = processingPhotos ? '正在处理照片…' : draftPhotos.length ? `已选 ${draftPhotos.length} / ${MAX_TASK_PHOTOS} 张 · 点击照片放大` : `可拍下作业页、题目或老师的要求，最多 ${MAX_TASK_PHOTOS} 张`
    const busy = processingPhotos || savingTask
    document.querySelectorAll('#task-form input').forEach(input => { input.disabled = savingTask || input.hasAttribute('data-required-date') })
    document.querySelectorAll('#task-form [data-action="assign-school-days"], #task-form [data-action="assign-all-week"], #task-form [data-action="assign-one-day"]').forEach(button => { button.disabled = savingTask })
    document.querySelectorAll('#task-form button[type="submit"], .remove-photo').forEach(button => { button.disabled = busy })
    document.querySelectorAll('[data-action="take-task-photo"], [data-action="choose-task-photos"]').forEach(button => { button.disabled = busy || draftPhotos.length >= MAX_TASK_PHOTOS })
  }
  async function addDraftPhotos(files) {
    if (processingPhotos || savingTask || !files.length) return
    const remaining = MAX_TASK_PHOTOS - draftPhotos.length
    const selection = Array.from(files).slice(0, remaining)
    processingPhotos = true
    renderDraftPhotos()
    let failed = 0
    try {
      for (const file of selection) {
        try { draftPhotos.push(await compressPhoto(file)) } catch (_) { failed += 1 }
      }
      if (failed) showToast('部分图片无法读取，请使用 JPG、PNG 或 WebP 图片')
      else if (files.length > remaining) showToast(`每项作业最多添加 ${MAX_TASK_PHOTOS} 张照片`)
    } finally {
      processingPhotos = false
      cameraInput.value = ''
      photoInput.value = ''
      renderDraftPhotos()
    }
  }
  function removeDraftPhoto(id) {
    if (processingPhotos || savingTask) return
    const photo = draftPhotos.find(item => item.id === id)
    if (photo) URL.revokeObjectURL(photo.url)
    draftPhotos = draftPhotos.filter(item => item.id !== id)
    renderDraftPhotos()
  }
  function clearTaskDraft() {
    draftPhotos.forEach(photo => URL.revokeObjectURL(photo.url))
    draftPhotos = []
    taskDraft = newTaskDraft()
    selectedTaskDate = localDateKey()
  }
  function renderTaskPhotos(task) {
    if (!task.photos.length) return ''
    return `<div class="task-photos"><span class="task-photos-label">作业参考照片 · 点击放大</span><div class="task-photo-grid">${task.photos.map((photo, index) => `<button type="button" class="task-photo-thumb" data-action="preview-task-photo" data-task-id="${escapeHtml(task.id)}" data-id="${escapeHtml(photo.id)}" aria-label="放大「${escapeHtml(task.title)}」的作业照片 ${index + 1}"><img data-photo-id="${escapeHtml(photo.id)}" alt="${escapeHtml(task.title)}的作业照片 ${index + 1}" loading="lazy"><span class="photo-placeholder">照片加载中</span><span class="photo-enlarge-mark">⤢</span></button>`).join('')}</div></div>`
  }
  function hydratePhotoThumbnails() {
    document.querySelectorAll('img[data-photo-id]').forEach(async image => {
      try {
        const url = await photoUrl(image.dataset.photoId)
        if (!image.isConnected) return
        if (!url) throw new Error('missing')
        image.src = url
        image.parentElement.classList.add('photo-ready')
      } catch (_) {
        if (image.isConnected) image.parentElement.querySelector('.photo-placeholder').textContent = '本机未找到照片'
      }
    })
  }
  async function openPhotoViewer(photos, id, opener) {
    if (!photos.length) return
    viewerPhotos = photos
    viewerIndex = Math.max(0, photos.findIndex(photo => photo.id === id))
    viewerOpener = opener
    photoViewer.showModal()
    document.body.classList.add('viewing-photo')
    await showViewerPhoto()
  }
  async function showViewerPhoto() {
    const request = ++viewerRequest
    const photo = viewerPhotos[viewerIndex]
    viewerZoom = 1
    viewerImage.hidden = true
    document.querySelector('#viewer-zoom-label').textContent = '100%'
    document.querySelector('[data-action="zoom-out"]').disabled = true
    document.querySelector('[data-action="zoom-in"]').disabled = true
    document.querySelector('#viewer-status').textContent = '正在打开照片…'
    document.querySelector('#viewer-caption').textContent = `作业照片 ${viewerIndex + 1} / ${viewerPhotos.length}`
    document.querySelector('[data-action="previous-photo"]').disabled = viewerIndex === 0
    document.querySelector('[data-action="next-photo"]').disabled = viewerIndex === viewerPhotos.length - 1
    try {
      const url = photo.url || await photoUrl(photo.id)
      if (!url) throw new Error('missing')
      if (request !== viewerRequest || !photoViewer.open) return
      viewerImage.src = url
      viewerImage.alt = photo.name || '作业照片'
      await viewerImage.decode()
      if (request !== viewerRequest || !photoViewer.open) return
      viewerImage.hidden = false
      document.querySelector('#viewer-status').textContent = ''
      resizeViewerPhoto()
    } catch (_) {
      if (request === viewerRequest) document.querySelector('#viewer-status').textContent = '本机未找到这张照片，请从包含照片的备份恢复。'
    }
  }
  function resizeViewerPhoto() {
    if (viewerImage.hidden || !viewerImage.naturalWidth) return
    const fit = Math.min(1, (viewerStage.clientWidth - 32) / viewerImage.naturalWidth, (viewerStage.clientHeight - 32) / viewerImage.naturalHeight)
    viewerImage.style.width = `${Math.max(1, viewerImage.naturalWidth * fit * viewerZoom)}px`
    document.querySelector('#viewer-zoom-label').textContent = `${Math.round(viewerZoom * 100)}%`
    document.querySelector('[data-action="zoom-out"]').disabled = viewerZoom <= 1
    document.querySelector('[data-action="zoom-in"]').disabled = viewerZoom >= 4
  }
  function zoomViewer(change) {
    viewerZoom = Math.max(1, Math.min(4, viewerZoom + change))
    resizeViewerPhoto()
  }
  function nowStamp() {
    return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replace(' ', ' ')
  }
  function todayLabel() {
    return new Intl.DateTimeFormat('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())
  }
  function addLog(message) {
    state.activityLog.unshift({ id: makeId(), message, stamp: nowStamp() })
    state.activityLog = state.activityLog.slice(0, 20)
  }
  function showToast(message, centered = false) {
    toast.textContent = message
    toast.classList.toggle('toast-centered', centered)
    toast.classList.add('visible')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => toast.classList.remove('visible'), centered ? 3200 : 2300)
  }
  function showInsufficientPoints(cost) {
    showToast(`积分还不够，还差 ${Math.max(0, cost - state.points)} 分。\n完成作业或请大人奖励后再来吧`, true)
  }
  function petClockNow() { return new Date() }
  function isPetSleeping(now = petClockNow()) {
    const minutes = now.getHours() * 60 + now.getMinutes()
    return minutes >= 22 * 60 + 30 || minutes < 6 * 60
  }
  function nextPetSleepBoundary(now = petClockNow()) {
    const next = new Date(now)
    if (isPetSleeping(now)) {
      next.setHours(6, 0, 0, 0)
      if (now.getHours() >= 22) next.setDate(next.getDate() + 1)
    } else next.setHours(22, 30, 0, 0)
    return next
  }
  function schedulePetSleepCheck() {
    clearTimeout(petSleepTimer)
    const now = petClockNow()
    petSleepTimer = setTimeout(syncPetSleep, Math.max(50, nextPetSleepBoundary(now).getTime() - now.getTime() + 25))
  }
  function syncPetSleep() {
    const sleeping = isPetSleeping()
    if (sleeping !== observedPetSleep) {
      observedPetSleep = sleeping
      if (sleeping) {
        clearTimeout(petAnimationTimer)
        petAnimation = null
      }
      if (currentView === 'pets' || currentView === 'shop') render()
      if (currentView === 'pets' && state.pets.length) showToast(sleeping ? '22:30 啦，小伙伴回家睡觉了，明早 06:00 再来吧' : '早上好，小伙伴睡醒啦！', true)
    }
    schedulePetSleepCheck()
  }
  function allowPetInteraction() {
    syncPetSleep()
    if (!isPetSleeping()) return true
    showToast('小伙伴正在睡觉 🌙\n每天 22:30–次日 06:00 暂停宠物互动', true)
    return false
  }
  function renderPetRestNotice() {
    return '<div class="pet-rest-notice" role="status"><span aria-hidden="true">🌙</span><div><strong>小伙伴睡觉啦，明早 06:00 再见</strong><small>每天 22:30–次日 06:00 暂停喂食、零食、玩具互动、出游和领养；可以切换查看睡觉中的伙伴。按设备本地时间。</small></div></div>'
  }
  function updateNav() {
    document.querySelectorAll('[data-view]').forEach(button => {
      const active = button.dataset.view === currentView
      button.classList.toggle('active', active)
      if (button.classList.contains('nav-link') || button.classList.contains('mobile-nav-link')) button.setAttribute('aria-current', active ? 'page' : 'false')
    })
  }
  function render() {
    topPoints.textContent = String(state.points)
    updateNav()
    const views = { home: renderHome, tasks: renderTasks, pets: renderPets, shop: renderShop }
    main.innerHTML = (views[currentView] || renderHome)()
    if (currentView === 'tasks') renderDraftPhotos()
    hydratePhotoThumbnails()
    scheduleTaskWindowCheck()
  }

  function renderHeading(eyebrow, title, subtitle, side = '') {
    return `<div class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div>${side}</div>`
  }
  function renderTaskPreview(task) {
    const checked = task.completed ? 'checked' : ''
    const taskStatus = task.completed ? '已经完成' : taskAvailability(task).status === 'expired' ? '已错过时间' : taskAvailability(task).status === 'upcoming' ? '未到时间' : '等待打卡'
    return `<div class="task-preview"><span class="task-check ${checked}">${task.completed ? '✓' : ''}</span><div class="task-preview-copy"><strong>${escapeHtml(task.title)}</strong><small data-preview-id="${escapeHtml(task.id)}">${escapeHtml(task.subject || '今日任务')} · ${taskStatus}</small></div>${task.photos.length ? `<button class="task-photo-thumb preview-photo-button" data-action="preview-task-photo" data-task-id="${escapeHtml(task.id)}" data-id="${escapeHtml(task.photos[0].id)}" aria-label="查看「${escapeHtml(task.title)}」的作业照片"><img data-photo-id="${escapeHtml(task.photos[0].id)}" alt="作业照片"><span class="photo-placeholder">📷</span></button>` : ''}<span class="reward-mini">${task.completed ? '✓ ' : '✦ '}${task.reward}分</span></div>`
  }
  function renderActivity(limit = 5) {
    if (!state.activityLog.length) return `<div class="empty-state"><span class="empty-icon">✨</span><strong>故事从第一次努力开始</strong><p>完成作业或照顾小伙伴后，记录会出现在这里。</p></div>`
    return `<div class="activity-list">${state.activityLog.slice(0, limit).map(item => `<div class="activity-row"><span class="activity-dot"></span><div class="activity-copy">${escapeHtml(item.message)}<time>${escapeHtml(item.stamp)}</time></div></div>`).join('')}</div>`
  }
  function petMood(pet) {
    if (pet.happiness >= 80) return '开心得摇尾巴呢！'
    if (pet.happiness >= 50) return '今天心情不错'
    return '想要你多陪陪它'
  }
  function renderPetMini(pet) {
    return `<div class="pet-mini"><span class="pet-mini-face">${escapeHtml(pet.emoji)}</span><div class="pet-mini-copy"><strong>${escapeHtml(pet.name)}</strong><small>开心度 ${pet.happiness}%</small></div></div>`
  }

  function renderHome() {
    const today = localDateKey()
    const dailyTasks = state.tasks.filter(task => task.scheduledDate === today)
    const completed = dailyTasks.filter(task => task.completed).length
    const total = dailyTasks.length
    const progress = total ? Math.round(completed / total * 100) : 0
    const progressMessage = !total ? '先安排今天要完成的事情吧' : completed === total ? '太棒啦，今天的任务都完成了！' : `再完成 ${total - completed} 项就全部完成啦`
    const heroPet = escapeHtml(state.pets[0]?.emoji || '🐶')
    const tasks = dailyTasks.slice(0, 4)
    return `<div class="welcome-row"><div class="page-heading"><span class="eyebrow">每一次认真，都有小小惊喜</span><h1>今天也加油呀！</h1><p class="page-subtitle">把一件件小事做好，宠物伙伴也会为你开心。</p></div><span class="date-chip">☀️ ${todayLabel()}</span></div>
      <section class="home-hero"><div class="hero-text"><span class="hero-kicker">我的成长星星</span><div class="hero-points"><strong>${state.points}</strong><span>积分</span></div><p>完成一项作业，就离心愿更近一步。</p><div class="hero-actions"><button class="hero-cta" data-view="tasks" data-date="${today}">去完成作业 <span>→</span></button><button class="hero-parent-button" data-action="parent-reward">✦ 大人奖励</button></div></div><div class="hero-pet-art"><span class="hero-orbit"></span><span class="hero-star star-a">✦</span><span class="hero-star star-b">✦</span><span class="hero-pet-emoji">${heroPet}</span></div></section>
      <div class="home-stats"><div class="stat-card"><span class="stat-icon">📚</span><div class="stat-copy"><span>今天的作业</span><strong>${completed}<small class="soft-label"> / ${total} 项</small></strong></div></div><div class="stat-card"><span class="stat-icon">🐾</span><div class="stat-copy"><span>我的小伙伴</span><strong>${state.pets.length}<small class="soft-label"> 只</small></strong></div></div><div class="stat-card"><span class="stat-icon">🥣</span><div class="stat-copy"><span>宠物饲料</span><strong>${state.food}<small class="soft-label"> 份</small></strong></div></div></div>
      <div class="home-columns"><section class="panel home-task-panel"><div class="section-title"><h2>今天的作业</h2><span class="section-note">${progressMessage}</span></div><div class="progress-label"><span>完成进度</span><strong>${progress}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>${tasks.length ? `<div class="preview-list">${tasks.map(renderTaskPreview).join('')}</div>${total > 4 ? `<span class="section-note">还有 ${total - 4} 项任务</span>` : ''}<button class="panel-footer-link" data-view="tasks" data-date="${today}">查看全部任务 →</button>` : `<div class="soft-prompt"><span>📝</span><small>先添加作业，完成打卡就能获得积分</small><button class="panel-footer-link" data-view="tasks" data-date="${today}">添加第一项作业 →</button></div>`}</section>
      <section class="panel home-pet-panel"><div class="section-title"><h2>我的小伙伴</h2><button class="quiet-button" data-view="pets">去照顾 →</button></div>${state.pets.length ? `<div class="my-pet-summary">${state.pets.slice(0, 4).map(renderPetMini).join('')}</div><button class="panel-footer-link" data-view="shop">用积分认识新伙伴 →</button>` : `<div class="soft-prompt"><span>🐾</span><small>还没有小伙伴，攒够积分就能领养啦</small><button class="panel-footer-link" data-view="shop">去积分小铺看看 →</button></div>`}</section></div>
      <section class="panel activity-panel"><div class="section-title"><h2>最近的小故事</h2><span class="section-note">每一次努力都有记录</span></div>${renderActivity(4)}</section>`
  }

  function renderTaskCard(task) {
    const availability = taskAvailability(task)
    return `<article class="panel task-card ${task.completed ? 'completed' : ''}"><div class="task-card-main"><span class="task-icon">${task.completed ? '✓' : '📚'}</span><div class="task-info"><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.subject || '当日任务')} · 奖励 ${task.reward} 积分</small></div>${task.completed ? '<span class="task-state">已打卡</span>' : `<button class="secondary-button button-small" data-action="complete-task" data-id="${escapeHtml(task.id)}" ${availability.allowed ? '' : 'disabled'}>${availability.button}</button>`}</div>${renderTaskPhotos(task)}<div class="task-card-actions"><span class="task-completed-at task-availability" data-status="${availability.status}">${task.completed ? `完成于 ${escapeHtml(task.completedAt)}` : escapeHtml(availability.message)}</span>${task.completed ? '<span class="reward-mini">已获得积分 ✦</span>' : `<button class="delete-task" data-action="delete-task" data-id="${escapeHtml(task.id)}">移除此任务</button>`}</div></article>`
  }
  function renderWeekCalendar() {
    const dates = weekDates(selectedTaskDate)
    const today = localDateKey()
    const weekdays = ['一', '二', '三', '四', '五', '六', '日']
    return `<section class="panel task-calendar" aria-label="每周作业安排"><div class="week-toolbar"><strong>${dates[0]} — ${dates[6]}</strong><div class="week-navigation"><button type="button" class="quiet-button" data-action="previous-task-week" aria-label="上一周">‹</button><button type="button" class="quiet-button" data-action="task-today">回到今天</button><button type="button" class="quiet-button" data-action="next-task-week" aria-label="下一周">›</button></div></div><div class="week-grid">${dates.map((date, index) => {
      const tasks = state.tasks.filter(task => task.scheduledDate === date)
      const completed = tasks.filter(task => task.completed).length
      return `<button type="button" class="week-day ${date === selectedTaskDate ? 'selected' : ''} ${date === today ? 'is-today' : ''}" data-action="select-task-date" data-date="${date}" aria-pressed="${date === selectedTaskDate}" aria-label="${taskDateLabel(date)}，${tasks.length}项作业，已完成${completed}项"><span>周${weekdays[index]}</span><strong>${Number(date.slice(-2))}</strong><small>${tasks.length ? `${completed}/${tasks.length} 项` : '暂无'}</small>${date === today ? '<i>今天</i>' : ''}</button>`
    }).join('')}</div><label class="calendar-date-jump">查看其他日期 <input id="task-date-picker" type="date" value="${selectedTaskDate}" aria-label="查看作业日期"></label></section>`
  }
  function renderAssignmentDates() {
    const primary = taskDraft.scheduledDate || selectedTaskDate
    const dates = weekDates(primary)
    const weekdays = ['一', '二', '三', '四', '五', '六', '日']
    return `<div class="assignment-field"><label class="assignment-primary"><span class="field-label">安排到哪一天</span><input class="text-input" name="scheduledDate" type="date" value="${primary}" required></label><div class="assignment-shortcuts"><button type="button" class="text-button" data-action="assign-school-days">周一至周五</button><button type="button" class="text-button" data-action="assign-all-week">整周每天</button><button type="button" class="text-button" data-action="assign-one-day">仅这一天</button></div><fieldset class="assignment-week"><legend>同样的作业还要安排到（可多选）</legend><div class="assignment-week-grid">${dates.map((date, index) => `<label class="assignment-day"><input type="checkbox" name="extraDate" value="${date}" ${date === primary || taskDraft.extraDates.includes(date) ? 'checked' : ''} ${date === primary ? 'disabled data-required-date' : ''}><span>周${weekdays[index]}</span><small>${Number(date.slice(5, 7))}/${Number(date.slice(-2))}</small></label>`).join('')}</div></fieldset><p class="form-help">每个日期会生成独立作业，积分分别领取；内容、参考照片和时间规则相同。</p></div>`
  }
  function renderTaskWindowFields() {
    return `<div class="task-window-field"><label class="task-window-toggle"><input type="checkbox" name="timeRestricted" ${taskDraft.timeRestricted ? 'checked' : ''}><span>设置可打卡时间段（选填）</span></label>${taskDraft.timeRestricted ? `<div class="task-window-inputs"><label><span class="field-label">开始时间</span><input class="text-input" type="time" name="startTime" value="${taskDraft.startTime}" required></label><span>至</span><label><span class="field-label">结束时间</span><input class="text-input" type="time" name="endTime" value="${taskDraft.endTime}" required></label></div><p class="form-help">按安排日期的本地时间计算；未开始或已结束都不能打卡。结束早于开始时，视为次日结束。</p>` : '<p class="form-help">未设置时间段的作业，随时都可以完成。</p>'}</div>`
  }
  function renderTasks() {
    const dailyTasks = state.tasks.filter(task => task.scheduledDate === selectedTaskDate)
    const tasks = dailyTasks.map(renderTaskCard).join('')
    return `${renderHeading('慢慢来，每一步都算数', '作业打卡', '按日期安排每一天，也可以提前布置整周作业。', `<div class="heading-actions"><span class="points-pill"><span>✦</span><strong>${state.points}</strong><small>积分</small></span><button class="outline-button" data-action="parent-reward">✦ 大人奖励</button></div>`)}${renderWeekCalendar()}
      <section class="task-list-section"><div class="section-title"><h2>${selectedTaskDate === localDateKey() ? '今天 · ' : ''}${taskDateLabel(selectedTaskDate)}</h2><span class="section-note">${dailyTasks.length} 项</span></div>${tasks ? `<div class="task-list">${tasks}</div>` : `<div class="panel empty-state"><span class="empty-icon">📝</span><strong>这一天还没有安排作业</strong><p>在下方添加，可一次选择多个日期，提前安排一周的作业。</p></div>`}<div class="checkin-banner"><span>🌼</span><div>作业照片和打卡记录只保存在当前浏览器，可通过“下载数据备份”一起备份。</div></div></section>
      <section class="panel task-add-panel"><div class="task-add-head"><span>＋</span><strong>安排新作业</strong></div><form id="task-form" class="task-form">
        <label class="form-title-field"><span class="field-label">作业内容</span><input class="text-input" name="title" maxlength="40" placeholder="例如：完成数学练习册第 3 页" value="${escapeHtml(taskDraft.title)}" required></label>
        <label class="form-subject-field"><span class="field-label">科目 / 备注（可不填）</span><input class="text-input" name="subject" maxlength="20" placeholder="例如：数学" value="${escapeHtml(taskDraft.subject)}"></label>
        <label class="reward-field"><span class="field-label">完成奖励（积分）</span><input class="text-input reward-input" name="reward" type="number" min="1" max="9007199254740991" step="1" value="${escapeHtml(taskDraft.reward)}" inputmode="numeric" required></label>
        ${renderAssignmentDates()}${renderTaskWindowFields()}
        <div class="task-photo-field"><span class="field-label">作业照片（选填）</span><div class="photo-upload-actions"><button type="button" class="outline-button" data-action="take-task-photo">📷 拍照</button><button type="button" class="outline-button" data-action="choose-task-photos">▧ 从相册选择</button></div><div id="draft-photos" class="draft-photo-grid"></div><p id="photo-selection-status" class="photo-selection-status" role="status"></p><span class="photo-local-note">照片只保存在这个浏览器，添加到作业后也可以点开放大。</span></div>
        <div class="form-submit-field"><button class="primary-button" type="submit">添加到清单 <span>→</span></button></div></form></section>`
  }

  function petKind(pet) {
    if (pet.species.includes('猫')) return 'cat'
    if (pet.species.includes('兔')) return 'rabbit'
    return 'dog'
  }
  function renderRoomArtwork(kind = 'dog') {
    if (kind !== 'dog') return window.PetArtwork.home(kind)
    return `<svg class="room-artwork" data-pet-scenery="dog-home" viewBox="0 0 720 650" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <rect width="720" height="650" fill="#fff1db"/>
      <path d="M0 60H720M0 148H720M0 236H720M0 324H720" stroke="#f8e9d0" stroke-width="2"/>
      <path d="M0 415H720V650H0Z" fill="#e9c5a3"/>
      <path d="M0 415H720" stroke="#b58a68" stroke-width="8"/>
      <g stroke="#cfaa88" stroke-width="2.5" fill="none"><path d="M0 456H720M0 502H720M0 548H720M0 595H720M0 642H720"/><path d="M168 416V456M485 416V456M60 456V502M370 456V502M650 456V502M220 502V548M535 502V548M96 548V595M405 548V595M680 548V595M250 595V642M560 595V642"/></g>
      <g stroke="#a48160" stroke-width="5" stroke-linejoin="round">
        <rect x="467" y="100" width="157" height="173" rx="7" fill="#d4ac7f"/>
        <rect x="478" y="111" width="135" height="151" rx="2" fill="#c3e4e7" stroke-width="3"/>
        <g stroke="none"><circle cx="579" cy="143" r="21" fill="#ffe7a3"/><g class="room-cloud"><path d="M486 177Q484 160 497 159Q505 142 519 156Q536 151 542 169L542 181H486" fill="#f9ffff"/><path d="M557 231Q557 215 569 216Q577 201 590 215Q607 213 610 232Z" fill="#f9ffff"/></g></g>
        <path d="M546 111V262M478 188H613" fill="none" stroke-width="7"/>
        <path d="M454 91H637" stroke="#9d795a" stroke-width="8" stroke-linecap="round"/>
        <path d="M456 97H479L473 220L455 233Z" fill="#edccad" stroke-width="2.5"/><path d="M612 97H635V233L616 220Z" fill="#edccad" stroke-width="2.5"/>
        <rect x="109" y="141" width="118" height="100" rx="4" fill="#d6ac7c"/><rect x="118" y="150" width="100" height="81" rx="2" fill="#fff9e9" stroke-width="2.5"/>
        <g stroke-width="3"><circle cx="192" cy="171" r="11" fill="#efcd72" stroke="#d6b66d"/><path d="M123 225L152 179Q157 174 162 182L187 225Z" fill="#9bbc85" stroke="#7e9c6b"/><path d="M158 225L186 195Q190 191 194 197L215 225Z" fill="#b5c99c" stroke="#8ba17b"/></g>
        <rect x="246" y="179" width="46" height="60" rx="3" fill="#e7bc93" stroke-width="4"/><rect x="253" y="186" width="32" height="46" rx="2" fill="#f3d2b6" stroke-width="2"/>
        <g fill="#f8e9b5" stroke="none"><ellipse cx="269" cy="204" rx="4" ry="9"/><ellipse cx="269" cy="216" rx="4" ry="9"/><ellipse cx="263" cy="210" rx="9" ry="4"/><ellipse cx="275" cy="210" rx="9" ry="4"/><circle cx="269" cy="210" r="4" fill="#dca36f"/></g>
        <ellipse cx="360" cy="445" rx="210" ry="19" fill="#c69b76" opacity=".22" stroke="none"/>
        <path d="M173 431V450Q173 458 184 458Q194 458 194 450V432M526 431V450Q526 458 536 458Q546 458 546 450V431" fill="#b48764" stroke-width="4"/>
        <rect x="168" y="300" width="385" height="136" rx="34" fill="#e7cf9f"/>
        <path d="M180 365Q180 352 194 352H527Q541 352 541 367V422H180Z" fill="#edd9b4" stroke-width="3"/>
        <path d="M301 363V423M420 363V423" fill="none" stroke="#ceb285" stroke-width="3"/>
        <rect x="146" y="350" width="45" height="91" rx="20" fill="#e7cea3" stroke-width="4"/><rect x="530" y="350" width="45" height="91" rx="20" fill="#e7cea3" stroke-width="4"/>
        <rect x="217" y="322" width="81" height="69" rx="10" transform="rotate(-8 257 356)" fill="#a6c8cf" stroke="#759aa8" stroke-width="3.5"/>
        <rect x="316" y="319" width="78" height="70" rx="10" fill="#bad2d3" stroke="#85a7ac" stroke-width="3.5"/>
        <rect x="417" y="323" width="79" height="69" rx="10" transform="rotate(8 456 357)" fill="#a6c8cf" stroke="#759aa8" stroke-width="3.5"/>
        <path d="M593 389H655L649 431H599Z" fill="#c5a17c" stroke-width="4"/>
        <rect x="588" y="381" width="72" height="13" rx="5" fill="#d9b48d" stroke-width="4"/>
        <path d="M599 430L595 454M646 430L650 454" stroke-width="5"/>
        <g stroke-width="2.5"><path d="M604 378V351H643V378" fill="#b0c4c5" stroke="#7d999c"/><path d="M612 350V337H649V350Z" fill="#e3b095" stroke="#b98d74"/><path d="M621 336V325H651V336Z" fill="#b1bf92" stroke="#91a06e"/></g>
        <ellipse cx="359" cy="553" rx="181" ry="61" fill="#eedbb9" stroke="#d2ad88" stroke-width="3"/>
        <ellipse cx="359" cy="553" rx="165" ry="49" fill="none" stroke="#d8bc96" stroke-width="2" stroke-dasharray="6 5"/>
        <g class="room-plant" stroke="#7f9b68" stroke-width="3"><path d="M104 541V453" fill="none"/><path d="M103 505Q63 501 70 463Q104 467 103 505Z" fill="#93b57f"/><path d="M105 486Q137 487 140 452Q107 453 105 486Z" fill="#aac391"/><path d="M103 469Q83 449 94 422Q119 442 103 469Z" fill="#88aa76"/><path d="M81 530H128L122 576Q106 586 87 575Z" fill="#c8936a" stroke="#a37756" stroke-width="4"/><ellipse cx="104" cy="531" rx="25" ry="8" fill="#9b7456" stroke="#b68762"/></g>
      </g>
    </svg>`
  }
  function renderOutdoorArtwork(scene, kind = 'dog') {
    if (kind !== 'dog') return window.PetArtwork.outdoor(kind, scene)
    const park = scene === 'park'
    const trees = `<g stroke="#72946a" stroke-width="4" stroke-linejoin="round"><path d="M105 409V276M608 410V267" stroke="#af8965" stroke-width="18"/><g class="outdoor-tree"><path d="M41 307Q15 273 49 250Q26 213 66 201Q76 161 113 180Q148 164 162 203Q195 217 174 250Q195 279 164 307Z" fill="#a6c88e"/><path d="M552 293Q529 257 560 238Q539 202 577 189Q590 153 622 172Q661 154 673 194Q709 207 687 242Q709 272 675 294Z" fill="#99bf8a"/></g><path d="M105 320L80 292M608 318L634 287" fill="none" stroke="#af8965" stroke-width="8"/></g>`
    const ground = `<path d="M0 365Q151 327 302 365Q500 328 720 365V650H0Z" fill="${park ? '#b9d79c' : '#c5dda7'}"/><path d="M0 440Q170 410 338 442T720 440V650H0Z" fill="${park ? '#cce2b2' : '#d9e8bc'}"/>`
    const flowers = `<g stroke="#83a76d" stroke-width="3" fill="none"><path d="M79 550V532M641 556V538M597 600V583M130 613V594"/></g><g fill="#fff8da" stroke="#e5c982" stroke-width="2"><circle cx="79" cy="529" r="9"/><circle cx="641" cy="535" r="9"/><circle cx="597" cy="580" r="8"/><circle cx="130" cy="591" r="8"/></g><g fill="#e6b968"><circle cx="79" cy="529" r="3"/><circle cx="641" cy="535" r="3"/><circle cx="597" cy="580" r="3"/><circle cx="130" cy="591" r="3"/></g>`
    return `<svg class="room-artwork outdoor-artwork" data-pet-scenery="dog-${scene}" viewBox="0 0 720 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="720" height="650" fill="${park ? '#dbf1eb' : '#e4f2fc'}"/><circle class="outdoor-sun" cx="545" cy="127" r="35" fill="#f9da89"/><g class="outdoor-clouds" fill="#fffdf4"><path d="M105 165Q95 139 120 131Q128 102 153 116Q180 99 190 128Q215 126 217 155Q216 167 203 167Z"/><path d="M405 214Q395 192 417 185Q425 164 445 176Q468 163 478 185Q504 184 506 209Z"/></g><path d="M0 353Q109 268 234 343Q374 247 516 334Q632 269 720 340V421H0Z" fill="#c3dcb3"/>
      ${ground}${trees}
      ${park ? `<path d="M370 370Q253 406 318 444Q440 487 340 650H536Q580 503 415 444Q340 412 426 370Z" fill="#f5e3b5" stroke="#decba1" stroke-width="3"/>
      <g stroke="#a58260" stroke-width="4" stroke-linecap="round"><path d="M483 414V448M615 414V448"/><rect x="472" y="368" width="156" height="17" rx="5" fill="#d3ad7f"/><rect x="472" y="392" width="156" height="17" rx="5" fill="#d3ad7f"/><path d="M468 418H634" stroke-width="14"/></g>
      <ellipse cx="127" cy="443" rx="104" ry="35" fill="#98c9bf" stroke="#80b4a6" stroke-width="4"/><path class="pond-ripple" d="M63 439Q98 430 133 438M108 455Q139 447 172 453" fill="none" stroke="#d5eee0" stroke-width="4" stroke-linecap="round"/><g fill="none" stroke="#85aaa0" stroke-width="3" stroke-linecap="round"><path d="M279 201Q287 190 295 201Q303 190 311 201M330 171Q336 164 342 171Q348 164 354 171"/></g>
      <g stroke="#b2946f" stroke-width="3"><path d="M235 391V316"/><path d="M210 309H271L282 323L271 337H210Z" fill="#fff6d8"/></g><path d="M227 322H260M251 316L260 322L251 328" stroke="#8caa73" stroke-width="3" fill="none"/>` : `<g stroke="#ad9980" stroke-width="3" fill="#faf1d8"><path d="M51 386V330L60 319L69 330V386M81 386V330L90 319L99 330V386M111 386V330L120 319L129 330V386M591 386V330L600 319L609 330V386M621 386V330L630 319L639 330V386M651 386V330L660 319L669 330V386"/><path d="M51 346H129M591 346H669M51 371H129M591 371H669" fill="none" stroke-width="6"/></g>
      <g stroke="#ac8c6a" stroke-width="5" stroke-linejoin="round"><path d="M257 364V233Q360 174 463 233V364" fill="none" stroke="#ddb283" stroke-width="13"/><path d="M265 231Q360 180 455 231V262Q360 215 265 262Z" fill="#fff4cf"/><g stroke="none"><circle cx="347" cy="230" r="8" fill="#c69f73"/><circle cx="372" cy="230" r="8" fill="#c69f73"/><ellipse cx="360" cy="246" rx="16" ry="11" fill="#c69f73"/></g><path d="M257 283L297 291L257 308ZM463 283L423 291L463 308Z" fill="#d7a19a" stroke-width="2"/></g>
      <g stroke="#9c9e80" stroke-width="4"><ellipse cx="201" cy="425" rx="57" ry="61" fill="#bed1b8"/><path d="M146 417Q138 366 168 365H212Q246 368 245 418" fill="#b4cad0"/><ellipse cx="166" cy="425" rx="39" ry="53" fill="#789b98"/><path d="M193 371Q210 391 211 423M218 375Q231 394 232 420" fill="none" stroke="#e1e8cd" stroke-width="6"/></g>
      <g stroke="#b69578" stroke-width="5" stroke-linejoin="round"><path d="M498 415V294H549V415" fill="none"/><path d="M498 315H548M498 341H548M498 367H548" fill="none" stroke-width="4"/><path d="M492 290H553L620 420H567L517 323H492Z" fill="#e9b38d"/><path d="M540 299L595 410" fill="none" stroke="#ffe0a8" stroke-width="17" stroke-linecap="round"/></g>
      <g fill="none" stroke="#c7a885" stroke-width="7"><path d="M440 520V453M520 520V453"/><ellipse cx="480" cy="448" rx="43" ry="50" stroke="#d9a3a2" stroke-width="10"/></g><g fill="#e8c97e" stroke="#bdab70" stroke-width="3"><path d="M285 396V376L299 363L313 376V396Z"/><path d="M408 396V376L422 363L436 376V396Z"/></g><path d="M299 379H422" stroke="#eac98a" stroke-width="7"/>`}
      ${flowers}<g stroke="#9fbd82" stroke-width="3" fill="none" stroke-linecap="round"><path d="M48 587L44 577M48 587L54 576M661 488L656 478M661 488L669 477M205 571L201 561M205 571L213 560"/></g>
    </svg>`
  }
  function renderTripProps(scene, kind = 'dog') {
    if (scene === 'park') return `<div class="trip-butterfly" aria-hidden="true"><svg viewBox="0 0 60 50"><g class="butterfly-wings" fill="#edc58c" stroke="#b5976d" stroke-width="2"><path d="M30 26Q-1 4 7 30Q11 48 30 30Q54 51 54 27Q58 1 30 26Z"/></g><path d="M30 21V36M30 22L25 17M30 22L35 16" stroke="#9b805c" stroke-width="2" fill="none" stroke-linecap="round"/></svg></div>`
    if (kind !== 'dog') return `<div class="trip-ball" aria-hidden="true">${window.PetArtwork.toy(kind)}</div><div class="trip-play-sparkles" aria-hidden="true"><span>✦</span><span>✧</span></div>`
    return `<div class="trip-ball" aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="33" fill="#e9bb7c" stroke="#ac8c68" stroke-width="4"/><path d="M40 7Q16 40 40 73M40 7Q66 40 40 73" fill="#a9c7be" stroke="#ac8c68" stroke-width="3"/><path d="M9 29Q39 47 71 29" fill="none" stroke="#fff4d5" stroke-width="5"/></svg></div><div class="trip-play-sparkles" aria-hidden="true"><span>✦</span><span>✧</span></div>`
  }
  function renderAnimatedAnimal(pet, sleeping = false) {
    const kind = petKind(pet)
    if (sleeping) return window.PetArtwork.sleeping(pet, kind)
    const fur = kind === 'dog' ? '#edc48a' : kind === 'cat' ? '#e5a86e' : '#fff7e8'
    const belly = kind === 'rabbit' ? '#edddd0' : '#fff4df'
    const tail = kind === 'rabbit'
      ? '<circle cx="233" cy="260" r="26" fill="#fff8eb"/>'
      : kind === 'cat'
        ? '<path d="M226 269C285 287 297 241 281 214C266 192 286 181 299 194" fill="none" stroke="#e5a86e" stroke-width="24"/><path d="M226 269C285 287 297 241 281 214C266 192 286 181 299 194" fill="none" stroke="#a6744d" stroke-width="3"/><path d="M278 250L292 245M274 221L288 216M283 188L287 202" stroke="#bd7d4d" stroke-width="7"/>'
        : '<path d="M226 265Q296 256 280 209Q277 198 268 207Q266 233 233 235Z" fill="#b7804e"/>'
    const ears = kind === 'rabbit'
      ? '<g class="pet-ear pet-ear-left"><ellipse cx="125" cy="81" rx="24" ry="70" transform="rotate(-13 125 81)" fill="#fff7e8"/><ellipse cx="125" cy="75" rx="12" ry="48" transform="rotate(-13 125 75)" fill="#eab9af" stroke="none"/></g><g class="pet-ear pet-ear-right"><ellipse cx="211" cy="79" rx="24" ry="69" transform="rotate(13 211 79)" fill="#fff7e8"/><ellipse cx="211" cy="73" rx="12" ry="47" transform="rotate(13 211 73)" fill="#eab9af" stroke="none"/></g>'
      : kind === 'cat'
        ? '<g class="pet-ear pet-ear-left"><path d="M91 130L92 66Q94 56 105 64L146 96Z" fill="#e5a86e"/><path d="M104 112L104 80L130 100Z" fill="#eab4a3" stroke="none"/></g><g class="pet-ear pet-ear-right"><path d="M195 96L235 64Q245 56 248 67L249 132Z" fill="#e5a86e"/><path d="M210 100L236 80L237 113Z" fill="#eab4a3" stroke="none"/></g>'
        : '<g class="pet-ear pet-ear-left"><path d="M112 100Q78 81 71 112L61 163Q61 193 84 195Q108 194 112 154Z" fill="#aa7147"/></g><g class="pet-ear pet-ear-right"><path d="M227 100Q261 82 268 112L279 162Q279 194 255 195Q233 194 227 153Z" fill="#aa7147"/></g>'
    const head = kind === 'rabbit'
      ? '<ellipse cx="170" cy="161" rx="82" ry="71" fill="#fff7e8"/>'
      : kind === 'cat'
        ? '<path d="M89 129Q97 91 168 91Q238 90 250 130Q272 173 235 204Q210 227 170 227Q127 228 99 204Q70 174 89 129Z" fill="#e5a86e"/><path d="M138 194Q145 167 170 170Q195 167 204 195Q200 219 170 219Q140 219 138 194Z" fill="#fff4df" stroke="none"/><path d="M155 97L161 115M171 95V118M186 98L181 115" stroke="#bc7d4c" stroke-width="7"/>'
        : '<path d="M89 134Q92 95 128 91Q170 80 212 92Q249 96 252 135L252 176Q246 222 171 226Q97 223 89 179Z" fill="#edc48a"/><path d="M135 191Q139 161 170 165Q202 162 206 190Q202 216 171 217Q139 217 135 191Z" fill="#fff4df" stroke="none"/><path d="M174 91Q204 87 222 102Q243 120 233 143Q214 153 204 130Q196 113 179 111Z" fill="#d6a36c" stroke="none"/>'
    const whiskers = kind === 'cat' ? '<g stroke="#9e704f" stroke-width="2.5"><path d="M104 175L73 168M105 185L73 189M234 175L265 167M234 185L265 189"/></g>' : ''
    return `<svg class="pet-character pet-character-${kind}" viewBox="0 0 340 340" role="img" aria-label="${escapeHtml(pet.name)}${sleeping ? '熟睡的' : '的动态'}${escapeHtml(pet.species)}形象">
      <g stroke="#825e45" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        <g class="pet-tail">${tail}</g>
        <g class="pet-body"><ellipse cx="170" cy="247" rx="70" ry="64" fill="${fur}"/><ellipse cx="170" cy="259" rx="37" ry="43" fill="${belly}" stroke="none"/><g class="pet-paw pet-paw-back-left"><ellipse cx="120" cy="293" rx="30" ry="16" fill="${fur}"/></g><g class="pet-paw pet-paw-back-right"><ellipse cx="222" cy="293" rx="30" ry="16" fill="${fur}"/></g><g class="pet-paw pet-paw-front-left"><path d="M132 240L128 283Q128 302 145 303Q160 302 160 285L159 249" fill="${belly}"/><path d="M138 291V298M149 291V298" stroke="#c5a78b" stroke-width="2"/></g><g class="pet-paw pet-paw-front-right"><path d="M182 249L181 285Q180 302 197 303Q213 301 211 284L207 241" fill="${belly}"/><path d="M190 291V298M201 291V298" stroke="#c5a78b" stroke-width="2"/></g></g>
        <g class="pet-head">${ears}${head}
          <g class="pet-eyes"><ellipse cx="136" cy="153" rx="8" ry="11" fill="#4c382d" stroke="none"/><ellipse cx="204" cy="153" rx="8" ry="11" fill="#4c382d" stroke="none"/><circle cx="138" cy="150" r="2.7" fill="#fff" stroke="none"/><circle cx="206" cy="150" r="2.7" fill="#fff" stroke="none"/></g>
          <g class="pet-eating-eyes" fill="none" stroke="#6d4e3a" stroke-width="4"><path d="M127 155Q136 147 145 155M195 155Q204 147 213 155"/></g>
          <g class="pet-sleep-eyes" fill="none" stroke="#6d4e3a" stroke-width="4"><path d="M125 153Q136 164 147 153M193 153Q204 164 215 153"/></g>
          <ellipse cx="117" cy="176" rx="12" ry="7" fill="#e8a08c" opacity=".6" stroke="none"/><ellipse cx="224" cy="176" rx="12" ry="7" fill="#e8a08c" opacity=".6" stroke="none"/>
          <path d="M161 171Q170 166 179 171Q180 179 170 183Q160 178 161 171Z" fill="${kind === 'dog' ? '#604333' : '#cf8c83'}" stroke="none"/>
          <g class="pet-mouth-idle"><path d="M170 183V188Q160 199 152 190M170 188Q180 199 188 190" fill="none" stroke-width="3"/>${kind === 'dog' ? '<path d="M166 195V203Q170 210 176 203V195" fill="#de9995" stroke="#b97d78" stroke-width="2"/>' : ''}</g>
          <g class="pet-mouth-chew"><ellipse cx="170" cy="191" rx="9" ry="6" fill="#a36950" stroke-width="2"/>${kind === 'rabbit' ? '<path d="M166 186H174V194H166Z" fill="#fff" stroke="none"/>' : ''}</g>${whiskers}
          <path class="pet-sleep-mouth" d="M164 193Q170 197 176 193" fill="none" stroke-width="3"/>
        </g>
      </g>
    </svg>`
  }
  function renderFoodBowl() {
    return `<svg viewBox="0 0 150 80" aria-hidden="true"><ellipse cx="75" cy="68" rx="57" ry="8" fill="#a78366" opacity=".2"/><g class="bowl-kibbles" fill="#bb8050" stroke="#93633e" stroke-width="2"><circle cx="43" cy="30" r="8"/><circle cx="60" cy="23" r="8"/><circle cx="77" cy="27" r="9"/><circle cx="95" cy="23" r="8"/><circle cx="110" cy="31" r="8"/><circle cx="59" cy="35" r="8"/><circle cx="89" cy="35" r="9"/></g><path d="M24 32H126L115 61Q75 76 35 61Z" fill="#a8c5b0" stroke="#779883" stroke-width="4"/><ellipse cx="75" cy="32" rx="51" ry="9" fill="none" stroke="#779883" stroke-width="4"/><path d="M69 48Q66 43 62 46Q60 51 69 56Q80 50 77 46Q73 43 69 48Z" fill="#f3edce" stroke="none"/></svg>`
  }
  function renderPetSupplies(pet, busy, lowMood) {
    const kind = petKind(pet), items = PET_SUPPLIES[kind], bag = state.supplies[kind]
    const sleeping = isPetSleeping(), mode = petAnimation?.petId === pet.id ? petAnimation.type : ''
    return `<section class="pet-supplies" aria-label="${escapeHtml(pet.name)}的玩具和零食"><div class="section-title"><h2>专属玩具与零食</h2><span class="section-note">${escapeHtml(pet.species)}专用 · 每件 50 积分</span></div><div class="pet-supply-grid">
      <div class="pet-supply-row"><div class="supply-icon" aria-hidden="true">${window.PetArtwork.toy(kind)}</div><div class="supply-copy"><strong>${items.toy}</strong><small>开心度 +${TOY_HAPPINESS} · 可反复玩</small><em>${bag.toy ? '已放入背包，同类伙伴共用' : '购买一次，解锁陪玩'}</em></div>${bag.toy ? `<button class="secondary-button button-small" data-action="use-supply" data-item="toy" data-id="${escapeHtml(pet.id)}" ${busy ? 'disabled' : ''}>${sleeping ? '睡觉中' : mode === 'toy' ? '玩耍中…' : '使用玩具'}</button>` : `<button class="primary-button button-small" data-action="buy-supply" data-kind="${kind}" data-item="toy">购买 · 50分</button>`}</div>
      <div class="pet-supply-row"><div class="supply-icon snack-icon" aria-hidden="true">${window.PetArtwork.snack(kind)}</div><div class="supply-copy"><strong>${items.snack}</strong><small>饱饱度 +${SNACK_SATIETY} · 每次 1 份</small><em>背包里还有 ${bag.snacks} 份</em></div><div class="supply-actions"><button class="secondary-button button-small" data-action="use-supply" data-item="snack" data-id="${escapeHtml(pet.id)}" ${busy || lowMood || bag.snacks < 1 || pet.satiety >= 100 ? 'disabled' : ''}>${sleeping ? '睡觉中' : mode === 'snacking' ? '吃零食中…' : lowMood ? '先哄开心' : pet.satiety >= 100 ? '已经吃饱' : '喂零食'}</button><button class="quiet-button" data-action="buy-supply" data-kind="${kind}" data-item="snack">${bag.snacks ? '再买一份' : '购买一份'} · 50分</button></div></div>
      </div><p class="supply-note">玩具和零食只给对应动物使用；数值最高 100%。睡觉时可以购买，醒来后再一起玩。</p></section>`
  }
  function renderPets() {
    const sleeping = isPetSleeping()
    const restNotice = sleeping ? renderPetRestNotice() : ''
    const heading = renderHeading('小小陪伴，慢慢长大', '宠物的小家', '学习累了，就来陪小伙伴待一会儿。', `<span class="points-pill"><span>✦</span><strong>${state.points}</strong><small>积分</small></span>`)
    if (!state.pets.length) return `${heading}${restNotice}<div class="panel empty-state pet-house-empty"><span class="empty-icon">🐾</span><strong>小家在等第一位伙伴</strong><p>完成作业攒积分，领养后就能在这里喂它、陪它玩。</p><button class="primary-button" data-view="shop">${sleeping ? '去小铺看看 →' : '去领养小伙伴 →'}</button></div>`
    const pet = state.pets.find(item => item.id === activePetId) || state.pets[0]
    activePetId = pet.id
    const mode = sleeping ? 'sleeping' : petAnimation?.petId === pet.id ? petAnimation.type : 'idle'
    const scene = mode === 'playing' ? petAnimation.scene : 'home'
    const trip = OUTINGS[scene]
    const busy = sleeping || Boolean(petAnimation)
    const lowMood = pet.happiness < 50
    const kind = petKind(pet)
    const theme = window.PetArtwork.themes[kind]
    const items = PET_SUPPLIES[kind]
    const speech = sleeping ? '呼噜噜……明早再一起玩～' : mode === 'toy' ? items.play : mode === 'snacking' ? items.eat : mode === 'eating' ? '啊呜啊呜，真香～' : scene === 'park' ? '闻闻花香，追一追小蝴蝶～' : scene === 'playground' ? (kind === 'cat' ? '扑一扑毛线球，玩得真开心～' : kind === 'rabbit' ? '蹦蹦跳跳，玩一玩小萝卜球～' : '追到小球啦，再跳一跳！') : lowMood ? '想先玩一玩，再吃饭～' : pet.satiety < 40 ? '肚子咕咕叫，想吃点好吃的～' : pet.happiness >= 80 ? '见到你就好开心呀！' : '今天也想和你一起玩～'
    const location = trip ? `${trip.icon} ${pet.name}在${theme[scene]}` : `${pet.name}的${theme.home}`
    const tripStyle = trip ? ` style="--trip-duration:${TRIP_DURATION}ms;--trip-elapsed:-${Math.min(TRIP_DURATION, Math.max(0, Date.now() - petAnimation.startedAt))}ms"` : ''
    const disabled = busy ? 'disabled' : ''
    const switchDisabled = petAnimation ? 'disabled' : ''
    return `${heading}${restNotice}<div class="pet-room-layout"><section class="pet-house ${trip ? 'is-on-trip' : ''} ${sleeping ? 'pet-house-sleeping' : ''}" aria-label="${escapeHtml(location)}">
      <header class="house-heading"><div><span class="house-eyebrow">${trip ? 'A LITTLE ADVENTURE' : 'MY COZY HOME'}</span><h2>${escapeHtml(location)} <span>${escapeHtml(pet.species)}</span></h2></div>${trip ? '<button type="button" class="trip-return" data-action="return-home">⌂ 回小家</button>' : `<span class="house-food">🥣 <strong>${state.food}</strong> 份饲料</span>`}</header>
      <div class="pet-room-scene is-${mode} scene-${scene}" data-pet-kind="${petKind(pet)}" data-pet-state="${mode}" data-scene="${scene}"${tripStyle}>${trip ? renderOutdoorArtwork(scene, kind) : renderRoomArtwork(kind)}
        <div class="room-vitals"><div class="room-vital"><div><span>🍚 饱饱度</span><strong>${pet.satiety}%</strong></div><div class="room-vital-track"><span style="width:${pet.satiety}%"></span></div></div><div class="room-vital"><div><span>💛 开心度</span><strong>${pet.happiness}%</strong></div><div class="room-vital-track happy"><span style="width:${pet.happiness}%"></span></div></div></div>
        <div class="pet-speech" role="status" aria-live="polite">${speech}</div>
        <div class="pet-floor-shadow" aria-hidden="true"></div><div class="pet-figure">${renderAnimatedAnimal(pet, sleeping)}</div>${sleeping ? '<div class="pet-sleep-sign" aria-hidden="true"><span>z</span><span>z</span><span>Z</span></div><div class="pet-night-moon" aria-hidden="true">☾</div>' : ''}
        ${trip ? renderTripProps(scene, kind) : mode === 'toy' ? `<div class="pet-toy-prop" data-toy-kind="${kind}" aria-hidden="true">${window.PetArtwork.toy(kind)}</div><div class="toy-sparkles" aria-hidden="true">✦ <span>✧</span></div>` : mode === 'snacking' ? `<div class="pet-snack-plate" data-snack-kind="${kind}" aria-hidden="true"><span class="snack-serving">${window.PetArtwork.snack(kind)}</span></div><div class="food-crumbs" aria-hidden="true"><i></i><i></i><i></i><i></i></div>` : `<div class="room-food-bowl">${renderFoodBowl()}</div><div class="food-crumbs" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`}<div class="pet-affection" aria-hidden="true"><span>♥</span><span>♥</span><span>✦</span></div>
        ${state.pets.length > 1 ? `<button class="room-switch room-switch-prev" data-action="previous-pet" aria-label="上一只宠物" ${switchDisabled}>‹</button><button class="room-switch room-switch-next" data-action="next-pet" aria-label="下一只宠物" ${switchDisabled}>›</button>` : ''}
        <span class="room-floor-note">${sleeping ? '晚安，明早 06:00 自动醒来' : mode === 'toy' ? `${items.toy}陪玩时间 · 开心度 +${petAnimation.gain}%` : mode === 'snacking' ? `正在享用${items.snack} · 饱饱度 +${petAnimation.gain}%` : mode === 'eating' ? '正在享用一份香香宠物粮' : scene === 'park' ? '沿着小路散散步 · 稍后回到小家' : scene === 'playground' ? '蹦蹦跳跳追小球 · 稍后回到小家' : '每一次陪伴，都在悄悄长大'}</span>${trip ? '<div class="trip-progress" aria-hidden="true"><span></span></div>' : ''}
      </div>
      ${!sleeping && lowMood ? '<p class="pet-mood-notice">💛 开心度达到 50% 才能喂食或吃零食。玩玩具 +20%，去公园 +18%，宠物乐园 +26%，最高 100%。</p>' : ''}
      <div class="pet-care-dock" aria-label="照顾宠物">
        ${sleeping || lowMood || state.food > 0 || mode === 'eating' ? `<button class="pet-care-button care-feed" data-action="feed-pet" data-id="${escapeHtml(pet.id)}" ${busy || lowMood ? 'disabled' : ''}><span class="care-button-icon">${sleeping ? '🌙' : '🥣'}</span><strong>${sleeping ? '睡觉中' : lowMood ? '先哄开心' : mode === 'eating' ? '吃饭中…' : '喂食'}</strong><small>${sleeping ? '06:00 后再来喂食' : lowMood ? '开心度需至少 50%' : '消耗 1 份饲料'}</small></button>` : `<button class="pet-care-button care-feed" data-view="shop" ${disabled}><span class="care-button-icon">🥣</span><strong>买点饲料</strong><small>背包里的饲料用完啦</small></button>`}
        <button class="pet-care-button care-walk" data-action="play-pet" data-id="${escapeHtml(pet.id)}" data-destination="park" ${disabled}><span class="care-button-icon">🌳</span><strong>${scene === 'park' ? '散步中…' : '去公园'}</strong><small>10 积分</small></button>
        <button class="pet-care-button care-play" data-action="play-pet" data-id="${escapeHtml(pet.id)}" data-destination="playground" ${disabled}><span class="care-button-icon">🎠</span><strong>${scene === 'playground' ? '玩耍中…' : '宠物乐园'}</strong><small>20 积分</small></button>
      </div>
      ${renderPetSupplies(pet, busy, lowMood)}
    </section><aside class="pet-room-aside"><section class="panel room-friends-panel"><div class="section-title"><h2>我的小伙伴</h2><span class="section-note">${state.pets.length} 只</span></div><div class="room-pet-list">${state.pets.map(friend => `<button class="room-pet-choice ${friend.id === pet.id ? 'selected' : ''}" data-action="select-pet" data-id="${escapeHtml(friend.id)}" aria-pressed="${friend.id === pet.id}" ${switchDisabled}><span>${escapeHtml(friend.emoji)}</span><div><strong>${escapeHtml(friend.name)}</strong><small>${escapeHtml(friend.species)}</small></div><i>${sleeping ? '睡觉中' : friend.id === pet.id ? (trip ? '出游中' : '在家里') : '去看看'}</i></button>`).join('')}</div><div class="room-bond-note"><span>♡</span><div><strong>${petMood(pet)}</strong><small>和${escapeHtml(pet.name)}一起出游过 ${pet.playCount} 次</small></div></div></section><section class="panel room-backpack"><div><span class="backpack-icon">🍪</span><h2>香香饲料</h2><p>背包里还有 <strong>${state.food}</strong> 份</p></div><button class="secondary-button" data-view="shop">去小铺补充 →</button></section><section class="panel room-stories"><div class="section-title"><h2>小家的日记</h2><span class="section-note">温暖的小事</span></div>${renderActivity(4)}</section></aside></div>`
  }

  function selectPet(id) {
    syncPetSleep()
    if (petAnimation || !state.pets.some(pet => pet.id === id)) return
    activePetId = id
    render()
    document.querySelector('.pet-house')?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }
  function cyclePet(direction) {
    syncPetSleep()
    if (petAnimation || state.pets.length < 2) return
    const index = Math.max(0, state.pets.findIndex(pet => pet.id === activePetId))
    selectPet(state.pets[(index + direction + state.pets.length) % state.pets.length].id)
  }
  function finishPetAnimation(duration, message) {
    clearTimeout(petAnimationTimer)
    petAnimationTimer = setTimeout(() => {
      petAnimation = null
      if (currentView === 'pets') { render(); if (!isPetSleeping()) showToast(message) }
    }, duration)
  }
  function returnPetHome() {
    if (!allowPetInteraction()) return
    if (petAnimation?.type !== 'playing') return
    clearTimeout(petAnimationTimer)
    const pet = state.pets.find(item => item.id === petAnimation.petId)
    petAnimation = null
    render()
    showToast(`${pet?.name || '小伙伴'}回到小家啦！`)
  }

  function renderSupplyShop(item) {
    const toy = item === 'toy'
    return `<section class="story-section"><div class="section-title"><h2>${toy ? '专属玩具' : '专属零食'}</h2><span class="section-note">${toy ? '购买一次，可反复玩 · 开心度 +20' : '每次消耗 1 份 · 饱饱度 +25'}</span></div><div class="catalog-grid supply-catalog">${CATALOG.map(animal => {
      const bag = state.supplies[animal.id], name = PET_SUPPLIES[animal.id][item]
      return `<article class="panel product-card supply-product" data-supply-product="${animal.id}-${item}"><div class="product-art ${animal.id}" aria-hidden="true">${toy ? window.PetArtwork.toy(animal.id) : window.PetArtwork.snack(animal.id)}</div><h3 class="product-name">${name}</h3><p class="product-intro">${animal.emoji} ${animal.species}专用 · ${toy ? '开心度 +20' : '饱饱度 +25'}</p><span class="supply-stock">${toy ? bag.toy ? '已拥有 · 同类伙伴共用' : '买一次，可反复使用' : `背包里还有 ${bag.snacks} 份`}</span><div class="product-bottom"><span class="product-price">✦ ${SUPPLY_PRICE} 积分</span><button class="primary-button button-small" data-action="buy-supply" data-kind="${animal.id}" data-item="${item}" ${toy && bag.toy ? 'disabled' : ''}>${toy && bag.toy ? '已拥有' : '购买'}</button></div></article>`
    }).join('')}</div></section>`
  }
  function renderShop() {
    const sleeping = isPetSleeping()
    const products = CATALOG.map(product => `<article class="panel product-card"><div class="product-art ${product.art}"><span>${product.emoji}</span><span class="product-heart">♥</span></div><h3 class="product-name">${product.name}</h3><p class="product-intro">${product.intro}</p><div class="product-bottom"><span class="product-price">✦ ${product.price}</span>${sleeping ? '<button class="primary-button button-small" disabled>06:00 后领养</button>' : state.points >= product.price ? `<button class="primary-button button-small" data-action="adopt" data-id="${product.id}">领养</button>` : `<span class="need-more">还差 ${product.price - state.points} 分</span>`}</div></article>`).join('')
    return `${renderHeading('认真努力，兑换喜欢的小惊喜', '积分小铺', '用打卡赚来的积分认识新伙伴，也给它准备玩具和好吃的。')}${sleeping ? renderPetRestNotice() : ''}<div class="shop-wallet"><div><small>我的积分</small><strong>✦ ${state.points}</strong></div><span class="shop-wallet-note">完成作业就能获得更多积分</span></div><section><div class="section-title"><h2>挑选一位新伙伴</h2><span class="section-note">领养后会一直陪着你</span></div><div class="catalog-grid">${products}</div></section><section class="story-section"><div class="section-title"><h2>给宠物买点饲料</h2><span class="section-note">一份饲料可以喂一只宠物</span></div><div class="panel food-panel"><span class="food-art">🥣</span><div class="food-copy"><strong>香香宠物粮 × 3</strong><small>适合狗狗、猫咪和小兔子</small><em>背包里还有 ${state.food} 份</em></div><div class="food-buy"><span class="product-price">✦ ${FOOD_PRICE}</span><button class="primary-button button-small" data-action="buy-food" ${state.points < FOOD_PRICE ? 'disabled' : ''}>购买</button></div></div></section>${renderSupplyShop('toy')}${renderSupplyShop('snack')}<p class="shop-footnote">购买后，到“我的宠物”里的专属背包点击使用。宠物、玩具和食物都是虚拟物品，均使用积分兑换 🐾</p>`
  }

  function commit(message) {
    if (!saveState()) {
      state = loadState()
      render()
      return false
    }
    render()
    if (message) showToast(message)
    return true
  }

  async function addTask(form) {
    if (savingTask || processingPhotos) return
    const data = new FormData(form)
    const title = String(data.get('title') || '').trim()
    if (!title) return showToast('先写下作业内容哦')
    const reward = Number(data.get('reward'))
    if (!isValidReward(reward)) return showToast('奖励积分请填写有效的正整数')
    const dates = [...new Set([String(data.get('scheduledDate') || ''), ...data.getAll('extraDate').map(String)])].sort()
    if (!dates.length || dates.length > 7 || dates.some(date => !isValidDateKey(date))) return showToast('请选择有效日期，一次最多安排 7 天')
    const timeWindow = data.has('timeRestricted') ? { start: String(data.get('startTime') || ''), end: String(data.get('endTime') || '') } : null
    if (timeWindow && !validTimeWindow(timeWindow)) return showToast('请选择有效的开始和结束时间，两者不能相同')
    savingTask = true
    renderDraftPhotos()
    const photos = [...draftPhotos]
    let previousState
    try {
      await writePhotoRecords(photos)
      previousState = structuredClone(state)
      state.tasks.unshift(...dates.map(scheduledDate => ({ id: makeId(), title, subject: String(data.get('subject') || '').trim(), reward, scheduledDate, timeWindow: timeWindow ? { ...timeWindow } : null, completed: false, completedAt: '', icon: '📚', photos: photos.map(photo => ({ id: photo.id, name: photo.name })) })))
      addLog(`安排了作业「${title}」到 ${dates.length} 天${photos.length ? `，附 ${photos.length} 张照片` : ''}`)
      if (!saveState()) {
        state = previousState
        await writePhotoRecords([], photos.map(photo => photo.id)).catch(() => {})
        return
      }
      photos.forEach(photo => photoUrls.set(photo.id, photo.url))
      draftPhotos = []
      taskDraft = newTaskDraft()
      selectedTaskDate = dates[0]
      render()
      showToast(dates.length > 1 ? `已为 ${dates.length} 天分别安排作业` : '作业添加成功')
    } catch (_) {
      if (previousState) state = previousState
      showToast('照片保存失败，请检查浏览器存储空间后重试')
    } finally {
      savingTask = false
      renderDraftPhotos()
    }
  }
  function dialogContent(title, description, body) {
    actionDialog.innerHTML = `<div class="action-dialog-body"><div class="dialog-topline"><span class="dialog-emblem" aria-hidden="true">🌱</span><button type="button" class="quiet-button dialog-close" data-action="close-action-dialog" aria-label="关闭弹窗">×</button></div><h2 id="action-dialog-title">${title}</h2><p id="action-dialog-description" class="dialog-description">${description}</p>${body}</div>`
  }
  function showActionDialog(opener) {
    dialogOpener = opener
    document.body.classList.add('viewing-action')
    actionDialog.showModal()
  }
  function confirmTask(id, opener) {
    if (actionDialog.open) return
    const task = state.tasks.find(item => item.id === id)
    if (!task || task.completed) return
    const availability = taskAvailability(task)
    if (!availability.allowed) return showToast(availability.message, true)
    dialogFlow = { stage: 'complete', taskId: id }
    dialogContent('这项作业完成了吗？', '检查一下有没有漏做的题目，再领取努力的小奖励。', `<div class="confirmation-card"><strong>${escapeHtml(task.title)}</strong><small>${taskDateLabel(task.scheduledDate)}${task.timeWindow ? ` · ${task.timeWindow.start}–${task.timeWindow.end < task.timeWindow.start ? '次日 ' : ''}${task.timeWindow.end}` : ' · 不限时间'}</small>${task.subject ? `<small>${escapeHtml(task.subject)}</small>` : ''}<span class="confirmation-points">✦ +${task.reward} 积分</span></div><p class="dialog-note">确认后标记为已完成，同一项作业只能领取一次积分。</p><div class="dialog-actions"><button type="button" class="outline-button" data-action="close-action-dialog" autofocus>再检查一下</button><button type="button" class="primary-button" data-action="confirm-task">确认完成，领取积分</button></div>`)
    showActionDialog(opener)
    actionDialog.querySelector('[data-action="close-action-dialog"][autofocus]').focus()
  }
  function readParentGuard() {
    try {
      const saved = JSON.parse(localStorage.getItem(PARENT_GUARD_KEY) || '{}')
      return { failures: clamp(saved.failures, 0, 2, 0), blockedUntil: nonNegativeInt(saved.blockedUntil) }
    } catch (_) { return { failures: 0, blockedUntil: 0 } }
  }
  function writeParentGuard(guard) {
    try { localStorage.setItem(PARENT_GUARD_KEY, JSON.stringify(guard)); return true }
    catch (_) { showToast('无法保存验证状态，请检查浏览器存储空间'); return false }
  }
  function newParentQuestion() {
    const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1))
    const a = randomInt(24, 69), b = randomInt(6, 9), c = randomInt(17, 48)
    return Math.random() < .5
      ? { label: `(${a} + ${c}) × ${b}`, answer: (a + c) * b }
      : { label: `${a} × ${b} − ${c}`, answer: a * b - c }
  }
  function openParentReward(opener) {
    if (actionDialog.open) return
    dialogFlow = { stage: 'gate', question: newParentQuestion(), error: '' }
    renderParentGate()
    showActionDialog(opener)
    actionDialog.querySelector('#parent-answer')?.focus()
  }
  function renderParentGate() {
    clearInterval(parentGateTimer)
    if (dialogFlow?.stage !== 'gate') return
    const guard = readParentGuard()
    const remaining = Math.max(0, Math.ceil((guard.blockedUntil - Date.now()) / 1000))
    dialogContent('请大人来发奖励', '答对 1 道随机计算题后，即可填写额外奖励。', `${remaining ? `<div class="gate-pause" role="status"><strong>先休息一下</strong><p>连续答错 3 次，请 ${remaining} 秒后再试。</p></div>` : `<div class="gate-progress"><span>1</span><small>只需答对这一题</small></div><form id="parent-gate-form"><label class="math-question" for="parent-answer">${dialogFlow.question.label} = ?</label><label><span class="field-label">计算结果</span><input id="parent-answer" class="text-input parent-answer" name="answer" type="text" inputmode="numeric" pattern="[0-9]+" maxlength="8" placeholder="请由大人填写答案" autocomplete="off" required></label><p id="gate-error" class="dialog-error" role="alert">${escapeHtml(dialogFlow.error)}</p><div class="dialog-actions"><button type="button" class="outline-button" data-action="close-action-dialog">取消</button><button type="submit" class="primary-button">验证并继续</button></div></form>`}<p class="dialog-note">计算题用于防止随手操作，无法代替家长密码；会计算或使用计算器的孩子仍可能通过。</p>`)
    if (remaining) parentGateTimer = setInterval(renderParentGate, 1000)
    else if (actionDialog.open) actionDialog.querySelector('#parent-answer').focus()
  }
  function verifyParentAnswer(form) {
    if (dialogFlow?.stage !== 'gate') return
    const guard = readParentGuard()
    if (guard.blockedUntil > Date.now()) return renderParentGate()
    const answer = String(new FormData(form).get('answer') || '').trim()
    if (!/^\d+$/.test(answer)) return
    if (Number(answer) !== dialogFlow.question.answer) {
      const failures = guard.failures + 1
      if (!writeParentGuard({ failures: failures >= 3 ? 0 : failures, blockedUntil: failures >= 3 ? Date.now() + 30000 : 0 })) return
      dialogFlow.question = newParentQuestion()
      dialogFlow.error = `答案不对，请重新答题。再答错 ${3 - failures} 次将暂停 30 秒。`
      return renderParentGate()
    }
    if (!writeParentGuard({ failures: 0, blockedUntil: 0 })) return
    dialogFlow = { stage: 'bonus', expiresAt: Date.now() + 5 * 60 * 1000, points: '', reason: '' }
    renderBonusForm()
  }
  function bonusAuthorized() {
    if (!['bonus', 'bonus-confirm'].includes(dialogFlow?.stage)) return false
    if (dialogFlow.expiresAt > Date.now() && readParentGuard().blockedUntil <= Date.now()) return true
    dialogFlow = { stage: 'gate', question: newParentQuestion(), error: '验证已过期，请大人重新答题。' }
    renderParentGate()
    return false
  }
  function renderBonusForm() {
    if (!bonusAuthorized()) return
    const recent = state.bonusRewards.slice(0, 5)
    dialogContent('送一份额外鼓励', '大人验证已通过 · 本次发放有效，5 分钟后需重新验证。', `<form id="bonus-form" class="bonus-form"><label><span class="field-label">奖励积分（1–${MAX_BONUS} 的整数）</span><input class="text-input" name="bonusPoints" type="number" min="1" max="${MAX_BONUS}" step="1" inputmode="numeric" value="${escapeHtml(dialogFlow.points)}" placeholder="例如：20" required></label><label><span class="field-label">为什么奖励？</span><input class="text-input" name="bonusReason" maxlength="60" value="${escapeHtml(dialogFlow.reason)}" placeholder="例如：今天主动整理书包" required></label><p id="bonus-error" class="dialog-error" role="alert"></p><div class="dialog-actions"><button type="button" class="outline-button" data-action="close-action-dialog">取消</button><button type="submit" class="primary-button">查看奖励并确认 →</button></div></form>${recent.length ? `<section class="bonus-history"><h3>最近的大人奖励</h3>${recent.map(item => `<div class="bonus-history-row"><div><strong>${escapeHtml(item.reason)}</strong><small>${escapeHtml(item.stamp)}</small></div><span>+${item.points}</span></div>`).join('')}<p class="dialog-note">保留最近 100 笔奖励记录，可随数据一起备份。</p></section>` : '<p class="dialog-note">奖励积分和原因会保存在这个浏览器，并出现在最近的小故事里。</p>'}`)
    actionDialog.querySelector('[name="bonusPoints"]').focus()
  }
  function reviewBonus(form) {
    if (!bonusAuthorized() || dialogFlow.stage !== 'bonus') return
    const data = new FormData(form)
    const points = Number(data.get('bonusPoints'))
    const reason = String(data.get('bonusReason') || '').trim()
    if (!isValidReward(points) || points > MAX_BONUS || !reason || reason.length > 60 || !Number.isSafeInteger(state.points + points)) {
      form.querySelector('#bonus-error').textContent = `请填写 1–${MAX_BONUS} 的整数积分，以及 1–60 字的奖励原因。`
      return
    }
    Object.assign(dialogFlow, { stage: 'bonus-confirm', points, reason })
    dialogContent('确认发放这份奖励？', '核对积分和原因，确认后立即计入余额。', `<div class="confirmation-card"><span class="confirmation-points">✦ +${points} 积分</span><strong>${escapeHtml(reason)}</strong><small>积分余额：${state.points} → ${state.points + points}</small></div><div class="dialog-actions"><button type="button" class="outline-button" data-action="edit-bonus" autofocus>返回修改</button><button type="button" class="primary-button" data-action="confirm-bonus">确认奖励 +${points} 积分</button></div><p class="dialog-note">每次发放后都会退出验证；下次奖励需要重新答题。</p>`)
    actionDialog.querySelector('[data-action="edit-bonus"]').focus()
  }
  function grantBonus() {
    if (!bonusAuthorized() || dialogFlow.stage !== 'bonus-confirm') return
    const { points, reason } = dialogFlow
    if (!isValidReward(points) || points > MAX_BONUS || !reason || !Number.isSafeInteger(state.points + points)) return
    dialogFlow = null // Consume this verification before saving; repeated clicks cannot grant twice.
    actionDialog.close()
    state.points += points
    state.bonusRewards.unshift({ id: makeId(), points, reason, stamp: nowStamp() })
    state.bonusRewards = state.bonusRewards.slice(0, 100)
    addLog(`大人奖励 +${points} 积分：${reason}`)
    commit(`收到大人的鼓励！+${points} 积分`)
  }
  function completeTask(id) {
    const task = state.tasks.find(item => item.id === id)
    if (!task || task.completed) return
    const availability = taskAvailability(task)
    if (!availability.allowed) { refreshTaskAvailability(); return showToast(availability.message, true) }
    if (!Number.isSafeInteger(state.points + task.reward)) return showToast('积分总数过大，暂时无法领取')
    task.completed = true
    task.completedAt = nowStamp()
    state.points += task.reward
    addLog(`完成「${task.title}」，获得 ${task.reward} 积分`)
    commit(`真棒！获得 ${task.reward} 积分`)
  }
  async function deleteTask(id) {
    const task = state.tasks.find(item => item.id === id)
    if (!task || task.completed) return
    if (!window.confirm(`确定移除“${task.title}”吗？`)) return
    state.tasks = state.tasks.filter(item => item.id !== id)
    if (commit('任务已移除')) {
      const keepIds = new Set(referencedPhotoIds())
      const removeIds = task.photos.map(photo => photo.id).filter(photoId => !keepIds.has(photoId))
      await writePhotoRecords([], removeIds).catch(() => {})
      removeIds.forEach(photoId => { if (photoUrls.has(photoId)) URL.revokeObjectURL(photoUrls.get(photoId)); photoUrls.delete(photoId) })
    }
  }
  function adoptPet(productId) {
    if (!allowPetInteraction()) return
    const product = CATALOG.find(item => item.id === productId)
    if (!product) return
    if (state.points < product.price) return showInsufficientPoints(product.price)
    const count = state.pets.filter(pet => pet.species === product.species).length
    const pet = { id: makeId(), species: product.species, name: count ? `${product.nameBase}${count + 1}` : product.nameBase, emoji: product.emoji, happiness: 72, satiety: 75, playCount: 0 }
    state.points -= product.price
    state.pets.push(pet)
    addLog(`领养了${pet.name}，欢迎新伙伴回家`)
    commit(`${pet.name}来啦！`)
  }
  function buyFood() {
    if (state.points < FOOD_PRICE) return showInsufficientPoints(FOOD_PRICE)
    state.points -= FOOD_PRICE
    state.food += 3
    addLog('买了 3 份香香宠物粮')
    commit('饲料放进背包啦')
  }
  function buySupply(kind, item) {
    if (!Object.hasOwn(PET_SUPPLIES, kind) || !['toy', 'snack'].includes(item)) return
    const bag = state.supplies[kind], name = PET_SUPPLIES[kind][item]
    if (item === 'toy' && bag.toy) return showToast('背包里已有这个玩具，可以反复使用')
    if (state.points < SUPPLY_PRICE) return showInsufficientPoints(SUPPLY_PRICE)
    state.points -= SUPPLY_PRICE
    if (item === 'toy') bag.toy = true
    else bag.snacks += 1
    addLog(`花费 ${SUPPLY_PRICE} 积分，买了${name}${item === 'snack' ? ' 1 份' : ''}`)
    commit(`${name}放进背包啦，去宠物的小家使用吧！`)
  }
  function usePetSupply(id, item) {
    if (!allowPetInteraction() || petAnimation || !['toy', 'snack'].includes(item)) return
    const pet = state.pets.find(friend => friend.id === id)
    if (!pet) return
    const kind = petKind(pet), bag = state.supplies[kind], name = PET_SUPPLIES[kind][item]
    if (item === 'toy' && !bag.toy) return showToast('先给这位小伙伴买一个专属玩具吧', true)
    if (item === 'snack') {
      if (pet.happiness < 50) return showToast('开心度不足 50%，暂时不能喂零食。\n先用玩具陪玩，或带小伙伴出去走走吧', true)
      if (bag.snacks < 1) return showToast('背包里没有这位小伙伴的零食啦', true)
      if (pet.satiety >= 100) return showToast('小伙伴已经吃饱啦，零食留到下次吧', true)
    }
    const gain = item === 'toy' ? Math.min(TOY_HAPPINESS, 100 - pet.happiness) : Math.min(SNACK_SATIETY, 100 - pet.satiety)
    if (item === 'toy') pet.happiness += gain
    else { bag.snacks -= 1; pet.satiety += gain }
    addLog(item === 'toy' ? `陪${pet.name}玩${name}，开心度 +${gain}` : `给${pet.name}喂了${name}，饱饱度 +${gain}`)
    activePetId = id
    petAnimation = { petId: id, type: item === 'toy' ? 'toy' : 'snacking', gain }
    if (!commit()) { petAnimation = null; render(); return }
    document.querySelector('.pet-house')?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    finishPetAnimation(item === 'toy' ? 6000 : 4200, item === 'toy' ? `${pet.name}玩得好开心！${gain ? `开心度 +${gain}` : '开心度已满'}` : `${pet.name}吃完零食啦，饱饱度 +${gain}！`)
  }
  function feedPet(id) {
    if (!allowPetInteraction()) return
    if (petAnimation) return
    const pet = state.pets.find(item => item.id === id)
    if (!pet) return
    if (pet.happiness < 50) return showToast('开心度不足 50%，暂时不能喂食。\n先去公园或宠物乐园，让小伙伴开心起来吧', true)
    if (state.food < 1) return showToast('背包里没有饲料啦')
    state.food -= 1
    pet.satiety = Math.min(100, pet.satiety + 32)
    pet.happiness = Math.min(100, pet.happiness + 6)
    addLog(`给${pet.name}喂了一份饲料`)
    activePetId = id
    petAnimation = { petId: id, type: 'eating' }
    if (!commit()) { petAnimation = null; render(); return }
    finishPetAnimation(3700, `${pet.name}吃饱啦，谢谢你！`)
  }
  function playPet(id, destination) {
    if (!allowPetInteraction()) return
    if (petAnimation) return
    const pet = state.pets.find(item => item.id === id)
    const outing = OUTINGS[destination]
    if (!pet || !outing) return
    const cost = outing.cost
    if (state.points < cost) return showInsufficientPoints(cost)
    state.points -= cost
    pet.happiness = Math.min(100, pet.happiness + outing.happiness)
    pet.satiety = Math.max(0, pet.satiety - 8)
    pet.playCount += 1
    addLog(`带${pet.name}去了${outing.name}，花费 ${cost} 积分`)
    activePetId = id
    petAnimation = { petId: id, type: 'playing', scene: destination, startedAt: Date.now() }
    if (!commit()) { petAnimation = null; render(); return }
    document.querySelector('.pet-house')?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    finishPetAnimation(TRIP_DURATION, `${pet.name}玩得很开心，回到小家啦！`)
  }
  function blobDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  }
  function dataUrlBlob(value) {
    if (typeof value !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=\s]+$/.test(value)) throw new Error('无效的备份照片')
    const [header, encoded] = value.split(',')
    const bytes = Uint8Array.from(atob(encoded), char => char.charCodeAt(0))
    return new Blob([bytes], { type: header.slice(5, header.indexOf(';')) })
  }
  async function exportBackup() {
    if (backupBusy || savingTask) return
    backupBusy = true
    const button = document.querySelector('[data-action="export"]')
    button.disabled = true
    try {
      const snapshot = structuredClone(state)
      const photos = []
      let missing = 0
      for (const id of referencedPhotoIds(snapshot)) {
        const record = await readPhoto(id).catch(() => null)
        if (!record?.blob) { missing += 1; continue }
        photos.push({ id, name: record.name, dataUrl: await blobDataUrl(record.blob) })
      }
      const blob = new Blob([JSON.stringify({ format: 'homework-pet-web', version: 2, exportedAt: new Date().toISOString(), data: snapshot, photos }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `作业小宠物备份-${new Date().toISOString().slice(0, 10)}.json`
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      showToast(missing ? `备份已下载，另有 ${missing} 张照片在本机未找到` : '备份已下载，包含作业照片')
    } catch (_) {
      showToast('备份失败，请检查浏览器存储权限后重试')
    } finally {
      backupBusy = false
      button.disabled = false
    }
  }
  async function importBackup(file) {
    if (!file || backupBusy || processingPhotos || savingTask) return
    backupBusy = true
    let newPhotos = []
    let previousState
    try {
      const parsed = JSON.parse(await file.text())
      const backup = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed
      if (!backup || !Array.isArray(backup.tasks) || !Array.isArray(backup.pets) || !Number.isFinite(Number(backup.points))) throw new Error('invalid')
      const nextState = normalizeState(backup)
      const attachments = new Map((Array.isArray(parsed.photos) ? parsed.photos : []).filter(photo => photo && typeof photo.id === 'string').map(photo => [photo.id, photo]))
      const replacementIds = new Map()
      let missing = 0
      for (const id of referencedPhotoIds(nextState)) {
        const attachment = attachments.get(id)
        const record = attachment ? { blob: dataUrlBlob(attachment.dataUrl), name: attachment.name } : await readPhoto(id).catch(() => null)
        if (!record?.blob) { missing += 1; continue }
        const newId = makeId()
        replacementIds.set(id, newId)
        newPhotos.push({ id: newId, blob: record.blob, name: String(record.name || '作业照片').slice(0, 100) })
      }
      nextState.tasks.forEach(task => { task.photos = task.photos.filter(photo => replacementIds.has(photo.id)).map(photo => ({ ...photo, id: replacementIds.get(photo.id) })) })
      if (!window.confirm(`导入会替换此浏览器里的当前数据。${missing ? `备份中缺少 ${missing} 张照片，这些照片无法恢复。` : ''}确定继续吗？`)) return
      await writePhotoRecords(newPhotos)
      previousState = state
      state = nextState
      if (!saveState()) {
        state = previousState
        await writePhotoRecords([], newPhotos.map(photo => photo.id)).catch(() => {})
        return
      }
      await writePhotoRecords([], referencedPhotoIds(previousState)).catch(() => {})
      releasePhotoUrls()
      clearTaskDraft()
      render()
      showToast(missing ? '记录已恢复，部分照片在备份中缺失' : '备份恢复成功，作业照片已恢复')
    } catch (_) {
      if (previousState) state = previousState
      if (newPhotos.length) await writePhotoRecords([], newPhotos.map(photo => photo.id)).catch(() => {})
      showToast('备份无法恢复，请检查文件格式和浏览器存储空间')
    } finally {
      backupBusy = false
      importFile.value = ''
    }
  }
  async function resetData() {
    if (savingTask || processingPhotos || backupBusy) return
    if (!window.confirm('清空后，这台浏览器里的任务、作业照片、积分和宠物记录都会删除。建议先下载备份。确定清空吗？')) return
    const previousState = state
    state = emptyState()
    if (!saveState()) { state = previousState; return }
    try {
      const db = await openPhotoDb()
      await new Promise((resolve, reject) => {
        const transaction = db.transaction('photos', 'readwrite')
        transaction.objectStore('photos').clear()
        transaction.oncomplete = resolve
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error || new Error('照片清理中断'))
      })
    } catch (_) { /* 文字记录已保存；照片存储可能被浏览器禁用。 */ }
    releasePhotoUrls()
    clearTaskDraft()
    render()
    showToast('本机数据已清空')
  }

  document.addEventListener('click', async event => {
    if (event.target === photoViewer) { photoViewer.close(); return }
    const viewButton = event.target.closest('[data-view]')
    if (viewButton) {
      event.preventDefault()
      currentView = viewButton.dataset.view
      if (currentView === 'tasks' && isValidDateKey(viewButton.dataset.date)) selectedTaskDate = viewButton.dataset.date
      render()
      main.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const button = event.target.closest('[data-action]')
    if (!button) return
    const action = button.dataset.action
    if (action === 'select-task-date') selectTaskDate(button.dataset.date)
    if (action === 'previous-task-week') selectTaskDate(addDateDays(selectedTaskDate, -7))
    if (action === 'next-task-week') selectTaskDate(addDateDays(selectedTaskDate, 7))
    if (action === 'task-today') selectTaskDate(localDateKey())
    if (action === 'assign-school-days') chooseAssignmentDays(5)
    if (action === 'assign-all-week') chooseAssignmentDays(7)
    if (action === 'assign-one-day' && !savingTask) { taskDraft.extraDates = []; render() }
    if (action === 'complete-task') confirmTask(button.dataset.id, button)
    if (action === 'parent-reward') openParentReward(button)
    if (action === 'close-action-dialog') actionDialog.close()
    if (action === 'confirm-task') {
      if (dialogFlow?.stage === 'complete') { const id = dialogFlow.taskId; actionDialog.close(); completeTask(id) }
    }
    if (action === 'confirm-bonus') grantBonus()
    if (action === 'edit-bonus' && dialogFlow?.stage === 'bonus-confirm') { dialogFlow.stage = 'bonus'; renderBonusForm() }
    if (action === 'delete-task') deleteTask(button.dataset.id)
    if (action === 'adopt') adoptPet(button.dataset.id)
    if (action === 'buy-food') buyFood()
    if (action === 'buy-supply') buySupply(button.dataset.kind, button.dataset.item)
    if (action === 'use-supply') usePetSupply(button.dataset.id, button.dataset.item)
    if (action === 'feed-pet') feedPet(button.dataset.id)
    if (action === 'select-pet') selectPet(button.dataset.id)
    if (action === 'previous-pet') cyclePet(-1)
    if (action === 'next-pet') cyclePet(1)
    if (action === 'play-pet') playPet(button.dataset.id, button.dataset.destination)
    if (action === 'return-home') returnPetHome()
    if (action === 'export') exportBackup()
    if (action === 'import') importFile.click()
    if (action === 'reset') resetData()
    if (action === 'take-task-photo') cameraInput.click()
    if (action === 'choose-task-photos') photoInput.click()
    if (action === 'remove-draft-photo') removeDraftPhoto(button.dataset.id)
    if (action === 'preview-draft-photo') await openPhotoViewer(draftPhotos, button.dataset.id, button)
    if (action === 'preview-task-photo') {
      const task = state.tasks.find(item => item.id === button.dataset.taskId)
      if (task) await openPhotoViewer(task.photos, button.dataset.id, button)
    }
    if (action === 'close-photo-viewer') photoViewer.close()
    if (action === 'previous-photo' && viewerIndex > 0) { viewerIndex -= 1; await showViewerPhoto() }
    if (action === 'next-photo' && viewerIndex < viewerPhotos.length - 1) { viewerIndex += 1; await showViewerPhoto() }
    if (action === 'zoom-in') zoomViewer(.5)
    if (action === 'zoom-out') zoomViewer(-.5)
    if (action === 'fit-photo') { viewerZoom = 1; resizeViewerPhoto(); viewerStage.scrollTo(0, 0) }
    if (action === 'toggle-photo-zoom') { viewerZoom = viewerZoom === 1 ? 2 : 1; resizeViewerPhoto() }
  })
  document.addEventListener('submit', event => {
    const form = event.target
    if (!['task-form', 'parent-gate-form', 'bonus-form'].includes(form.id)) return
    event.preventDefault()
    if (form.id === 'task-form') addTask(form)
    if (form.id === 'parent-gate-form') verifyParentAnswer(form)
    if (form.id === 'bonus-form') reviewBonus(form)
  })
  document.addEventListener('input', event => {
    if (event.target.closest('#task-form') && ['title', 'subject', 'reward', 'startTime', 'endTime'].includes(event.target.name)) taskDraft[event.target.name] = event.target.value
  })
  document.addEventListener('change', event => {
    const input = event.target
    if (input.id === 'task-date-picker') selectTaskDate(input.value)
    if (!input.closest('#task-form')) return
    if (input.name === 'scheduledDate' && isValidDateKey(input.value)) { taskDraft.scheduledDate = input.value; taskDraft.extraDates = []; render() }
    if (input.name === 'timeRestricted') { taskDraft.timeRestricted = input.checked; render() }
    if (input.name === 'extraDate') taskDraft.extraDates = [...document.querySelectorAll('#task-form [name="extraDate"]:checked:not([data-required-date])')].map(item => item.value)
  })
  importFile.addEventListener('change', event => importBackup(event.target.files?.[0]))
  cameraInput.addEventListener('change', event => addDraftPhotos(event.target.files))
  photoInput.addEventListener('change', event => addDraftPhotos(event.target.files))
  actionDialog.addEventListener('close', () => {
    clearInterval(parentGateTimer)
    dialogFlow = null
    actionDialog.innerHTML = ''
    document.body.classList.remove('viewing-action')
    if (dialogOpener?.isConnected) dialogOpener.focus()
    else main.focus({ preventScroll: true })
  })
  photoViewer.addEventListener('close', () => {
    viewerRequest += 1
    viewerImage.removeAttribute('src')
    viewerPhotos = []
    document.body.classList.remove('viewing-photo')
    if (viewerOpener?.isConnected) viewerOpener.focus()
  })
  photoViewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' && viewerIndex > 0) { event.preventDefault(); viewerIndex -= 1; showViewerPhoto() }
    if (event.key === 'ArrowRight' && viewerIndex < viewerPhotos.length - 1) { event.preventDefault(); viewerIndex += 1; showViewerPhoto() }
  })
  window.addEventListener('resize', () => { if (photoViewer.open) resizeViewerPhoto() })
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) {
      if (actionDialog.open) actionDialog.close()
      state = loadState()
      render()
      showToast('这个浏览器中的数据已更新')
    }
  })

  window.addEventListener('focus', syncPetSleep)
  window.addEventListener('focus', syncTaskCalendar)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncPetSleep() })
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncTaskCalendar() })
  setInterval(syncPetSleep, 30000)
  setInterval(syncTaskCalendar, 60000)
  schedulePetSleepCheck()
  render()
})()
