(() => {
  'use strict'

  const STORAGE_KEY = 'homework-pet-web-v1'
  const CATALOG = [
    { id: 'dog', species: '狗狗', name: '小狗', nameBase: '团团', emoji: '🐶', intro: '活泼热情，最爱陪你散步', price: 80, art: 'dog' },
    { id: 'cat', species: '猫咪', name: '小猫', nameBase: '咪咪', emoji: '🐱', intro: '软软糯糯，喜欢晒太阳', price: 80, art: 'cat' },
    { id: 'rabbit', species: '兔兔', name: '小兔', nameBase: '跳跳', emoji: '🐰', intro: '蹦蹦跳跳，喜欢胡萝卜', price: 60, art: 'rabbit' }
  ]
  const FOOD_PRICE = 20
  const main = document.querySelector('#main-view')
  const topPoints = document.querySelector('#top-points')
  const toast = document.querySelector('#toast')
  const importFile = document.querySelector('#import-file')
  let currentView = 'home'
  let toastTimer = 0

  const emptyState = () => ({ points: 0, tasks: [], pets: [], food: 0, activityLog: [] })
  const makeId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (!saved || typeof saved !== 'object') return emptyState()
      return {
        points: nonNegativeInt(saved.points),
        tasks: Array.isArray(saved.tasks) ? saved.tasks.filter(item => item && typeof item.title === 'string').map(item => ({
          id: String(item.id || makeId()), title: item.title.slice(0, 60), subject: typeof item.subject === 'string' ? item.subject.slice(0, 30) : '',
          reward: isValidReward(item.reward) ? Number(item.reward) : 10, completed: Boolean(item.completed), completedAt: String(item.completedAt || ''), icon: '📚'
        })) : [],
        pets: Array.isArray(saved.pets) ? saved.pets.filter(item => item && typeof item.name === 'string').map(item => ({
          id: String(item.id || makeId()), species: String(item.species || '宠物'), name: item.name.slice(0, 20), emoji: String(item.emoji || '🐾'),
          happiness: clamp(item.happiness, 0, 100, 72), satiety: clamp(item.satiety, 0, 100, 75), playCount: nonNegativeInt(item.playCount)
        })) : [],
        food: nonNegativeInt(saved.food),
        activityLog: Array.isArray(saved.activityLog) ? saved.activityLog.filter(item => item && typeof item.message === 'string').slice(0, 20).map(item => ({ id: String(item.id || makeId()), message: item.message.slice(0, 120), stamp: String(item.stamp || '') })) : []
      }
    } catch (_) {
      return emptyState()
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
  function showToast(message) {
    toast.textContent = message
    toast.classList.add('visible')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2300)
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
  }

  function renderHeading(eyebrow, title, subtitle, side = '') {
    return `<div class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div>${side}</div>`
  }
  function renderTaskPreview(task) {
    const checked = task.completed ? 'checked' : ''
    return `<div class="task-preview"><span class="task-check ${checked}">${task.completed ? '✓' : ''}</span><div class="task-preview-copy"><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.subject || '今日任务')} · ${task.completed ? '已经完成' : '等待打卡'}</small></div><span class="reward-mini">${task.completed ? '✓ ' : '✦ '}${task.reward}分</span></div>`
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
    const completed = state.tasks.filter(task => task.completed).length
    const total = state.tasks.length
    const progress = total ? Math.round(completed / total * 100) : 0
    const progressMessage = !total ? '先安排今天要完成的事情吧' : completed === total ? '太棒啦，今天的任务都完成了！' : `再完成 ${total - completed} 项就全部完成啦`
    const heroPet = escapeHtml(state.pets[0]?.emoji || '🐶')
    const tasks = state.tasks.slice(0, 4)
    return `<div class="welcome-row"><div class="page-heading"><span class="eyebrow">每一次认真，都有小小惊喜</span><h1>今天也加油呀！</h1><p class="page-subtitle">把一件件小事做好，宠物伙伴也会为你开心。</p></div><span class="date-chip">☀️ ${todayLabel()}</span></div>
      <section class="home-hero"><div class="hero-text"><span class="hero-kicker">我的成长星星</span><div class="hero-points"><strong>${state.points}</strong><span>积分</span></div><p>完成一项作业，就离心愿更近一步。</p><button class="hero-cta" data-view="tasks">去完成作业 <span>→</span></button></div><div class="hero-pet-art"><span class="hero-orbit"></span><span class="hero-star star-a">✦</span><span class="hero-star star-b">✦</span><span class="hero-pet-emoji">${heroPet}</span></div></section>
      <div class="home-stats"><div class="stat-card"><span class="stat-icon">📚</span><div class="stat-copy"><span>今天的作业</span><strong>${completed}<small class="soft-label"> / ${total} 项</small></strong></div></div><div class="stat-card"><span class="stat-icon">🐾</span><div class="stat-copy"><span>我的小伙伴</span><strong>${state.pets.length}<small class="soft-label"> 只</small></strong></div></div><div class="stat-card"><span class="stat-icon">🥣</span><div class="stat-copy"><span>宠物饲料</span><strong>${state.food}<small class="soft-label"> 份</small></strong></div></div></div>
      <div class="home-columns"><section class="panel home-task-panel"><div class="section-title"><h2>今天的作业</h2><span class="section-note">${progressMessage}</span></div><div class="progress-label"><span>完成进度</span><strong>${progress}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>${tasks.length ? `<div class="preview-list">${tasks.map(renderTaskPreview).join('')}</div>${total > 4 ? `<span class="section-note">还有 ${total - 4} 项任务</span>` : ''}<button class="panel-footer-link" data-view="tasks">查看全部任务 →</button>` : `<div class="soft-prompt"><span>📝</span><small>先添加作业，完成打卡就能获得积分</small><button class="panel-footer-link" data-view="tasks">添加第一项作业 →</button></div>`}</section>
      <section class="panel home-pet-panel"><div class="section-title"><h2>我的小伙伴</h2><button class="quiet-button" data-view="pets">去照顾 →</button></div>${state.pets.length ? `<div class="my-pet-summary">${state.pets.slice(0, 4).map(renderPetMini).join('')}</div><button class="panel-footer-link" data-view="shop">用积分认识新伙伴 →</button>` : `<div class="soft-prompt"><span>🐾</span><small>还没有小伙伴，攒够积分就能领养啦</small><button class="panel-footer-link" data-view="shop">去积分小铺看看 →</button></div>`}</section></div>
      <section class="panel activity-panel"><div class="section-title"><h2>最近的小故事</h2><span class="section-note">每一次努力都有记录</span></div>${renderActivity(4)}</section>`
  }

  function renderTasks() {
    const tasks = state.tasks.map(task => `<article class="panel task-card ${task.completed ? 'completed' : ''}"><div class="task-card-main"><span class="task-icon">${task.completed ? '✓' : '📚'}</span><div class="task-info"><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.subject || '今日任务')} · 奖励 ${task.reward} 积分</small></div>${task.completed ? '<span class="task-state">已打卡</span>' : `<button class="secondary-button button-small" data-action="complete-task" data-id="${escapeHtml(task.id)}">完成打卡 +${task.reward}</button>`}</div><div class="task-card-actions"><span class="task-completed-at">${task.completed ? `完成于 ${escapeHtml(task.completedAt)}` : '完成后点击打卡即可领取积分'}</span>${task.completed ? '<span class="reward-mini">已获得积分 ✦</span>' : `<button class="delete-task" data-action="delete-task" data-id="${escapeHtml(task.id)}">移除此任务</button>`}</div></article>`).join('')
    return `${renderHeading('慢慢来，每一步都算数', '作业打卡', '写下今天要完成的作业，完成后点一下打卡，就能领取积分。', `<span class="points-pill"><span>✦</span><strong>${state.points}</strong><small>积分</small></span>`)}
      <section class="panel task-add-panel"><div class="task-add-head"><span>＋</span><strong>安排一项新作业</strong></div><form id="task-form" class="task-form"><label class="form-title-field"><span class="field-label">作业内容</span><input class="text-input" name="title" maxlength="40" placeholder="例如：完成数学练习册第 3 页" required></label><label><span class="field-label">科目 / 备注（可不填）</span><input class="text-input" name="subject" maxlength="20" placeholder="例如：数学"></label><label class="reward-field"><span class="field-label">完成奖励（积分）</span><input class="text-input reward-input" name="reward" type="number" min="1" max="9007199254740991" step="1" value="10" inputmode="numeric" required></label><div class="form-submit-field"><button class="primary-button" type="submit">添加到清单 <span>→</span></button></div></form></section>
      <section class="task-list-section"><div class="section-title"><h2>任务清单</h2><span class="section-note">${state.tasks.length} 项</span></div>${tasks ? `<div class="task-list">${tasks}</div>` : `<div class="panel empty-state"><span class="empty-icon">📝</span><strong>清单还是空的</strong><p>添加一项作业，完成后点“完成打卡”领取积分。</p></div>`}<div class="checkin-banner"><span>🌼</span><div>这是给家人使用的本地网页。打卡不需要上传照片，记录只保存在当前浏览器。</div></div></section>`
  }

  function renderPets() {
    const pets = state.pets.map(pet => `<article class="panel pet-card"><div class="pet-card-top"><span class="pet-avatar">${escapeHtml(pet.emoji)}</span><div class="pet-name-area"><div class="pet-name-line"><strong>${escapeHtml(pet.name)}</strong><span class="species-label">${escapeHtml(pet.species)}</span></div><p class="pet-mood">${petMood(pet)}</p><p class="pet-bond">一起玩过 ${pet.playCount} 次</p></div></div><div class="meter-row"><div class="meter-top"><span>🍚 饱饱度</span><strong>${pet.satiety}%</strong></div><div class="meter-track"><div class="meter-fill" style="width:${pet.satiety}%"></div></div></div><div class="meter-row"><div class="meter-top"><span>💛 开心度</span><strong>${pet.happiness}%</strong></div><div class="meter-track"><div class="meter-fill happy" style="width:${pet.happiness}%"></div></div></div><div class="pet-actions">${state.food > 0 ? `<button class="secondary-button button-small" data-action="feed-pet" data-id="${escapeHtml(pet.id)}">🍪 喂一份（${state.food}）</button>` : `<button class="outline-button button-small" data-view="shop">🍪 去买饲料</button>`}<button class="outline-button play-button button-small" data-action="play-pet" data-id="${escapeHtml(pet.id)}" data-cost="10" data-outing="公园散步">🌳 公园 · 10 分</button><button class="outline-button play-button button-small" data-action="play-pet" data-id="${escapeHtml(pet.id)}" data-cost="20" data-outing="宠物乐园">🎠 乐园 · 20 分</button></div></article>`).join('')
    return `${renderHeading('照顾它们，也是在练习爱与责任', '我的小伙伴', '喂喂它、陪它玩，它会越来越开心。', `<span class="points-pill"><span>✦</span><strong>${state.points}</strong><small>积分</small></span>`)}${pets ? `<div class="pet-grid">${pets}</div>` : `<div class="panel empty-state"><span class="empty-icon">🐾</span><strong>等待你领养第一位伙伴</strong><p>完成作业打卡赚积分，再去小铺挑一只喜欢的宠物吧。</p><button class="primary-button" data-view="shop">去积分小铺看看 →</button></div>`}<section class="story-section"><div class="section-title"><h2>最近的小故事</h2><span class="section-note">每一次努力都有记录</span></div><div class="panel panel-pad">${renderActivity(8)}</div></section>`
  }

  function renderShop() {
    const products = CATALOG.map(product => `<article class="panel product-card"><div class="product-art ${product.art}"><span>${product.emoji}</span><span class="product-heart">♥</span></div><h3 class="product-name">${product.name}</h3><p class="product-intro">${product.intro}</p><div class="product-bottom"><span class="product-price">✦ ${product.price}</span>${state.points >= product.price ? `<button class="primary-button button-small" data-action="adopt" data-id="${product.id}">领养</button>` : `<span class="need-more">还差 ${product.price - state.points} 分</span>`}</div></article>`).join('')
    return `${renderHeading('认真努力，兑换喜欢的小惊喜', '积分小铺', '用打卡赚来的积分认识新伙伴，也给它准备好吃的。')}<div class="shop-wallet"><div><small>我的积分</small><strong>✦ ${state.points}</strong></div><span class="shop-wallet-note">完成作业就能获得更多积分</span></div><section><div class="section-title"><h2>挑选一位新伙伴</h2><span class="section-note">领养后会一直陪着你</span></div><div class="catalog-grid">${products}</div></section><section class="story-section"><div class="section-title"><h2>给宠物买点饲料</h2><span class="section-note">一份饲料可以喂一只宠物</span></div><div class="panel food-panel"><span class="food-art">🥣</span><div class="food-copy"><strong>香香宠物粮 × 3</strong><small>适合狗狗、猫咪和小兔子</small><em>背包里还有 ${state.food} 份</em></div><div class="food-buy"><span class="product-price">✦ ${FOOD_PRICE}</span><button class="primary-button button-small" data-action="buy-food" ${state.points < FOOD_PRICE ? 'disabled' : ''}>购买</button></div></div></section><p class="shop-footnote">积分来自完成作业打卡。宠物和饲料都是网页里的虚拟物品 🐾</p>`
  }

  function commit(message) {
    saveState()
    render()
    if (message) showToast(message)
  }

  function addTask(form) {
    const data = new FormData(form)
    const title = String(data.get('title') || '').trim()
    if (!title) return showToast('先写下作业内容哦')
    const reward = Number(data.get('reward'))
    if (!isValidReward(reward)) return showToast('奖励积分请填写有效的正整数')
    state.tasks.unshift({ id: makeId(), title, subject: String(data.get('subject') || '').trim(), reward, completed: false, completedAt: '', icon: '📚' })
    addLog(`添加了作业「${title}」`)
    form.reset()
    commit('作业添加成功')
  }
  function completeTask(id) {
    const task = state.tasks.find(item => item.id === id)
    if (!task || task.completed) return
    task.completed = true
    task.completedAt = nowStamp()
    state.points += task.reward
    addLog(`完成「${task.title}」，获得 ${task.reward} 积分`)
    commit(`真棒！获得 ${task.reward} 积分`)
  }
  function deleteTask(id) {
    const task = state.tasks.find(item => item.id === id)
    if (!task || task.completed) return
    if (!window.confirm(`确定移除“${task.title}”吗？`)) return
    state.tasks = state.tasks.filter(item => item.id !== id)
    commit('任务已移除')
  }
  function adoptPet(productId) {
    const product = CATALOG.find(item => item.id === productId)
    if (!product) return
    if (state.points < product.price) return showToast('积分还不够哦')
    const count = state.pets.filter(pet => pet.species === product.species).length
    const pet = { id: makeId(), species: product.species, name: count ? `${product.nameBase}${count + 1}` : product.nameBase, emoji: product.emoji, happiness: 72, satiety: 75, playCount: 0 }
    state.points -= product.price
    state.pets.push(pet)
    addLog(`领养了${pet.name}，欢迎新伙伴回家`)
    commit(`${pet.name}来啦！`)
  }
  function buyFood() {
    if (state.points < FOOD_PRICE) return showToast('积分还不够哦')
    state.points -= FOOD_PRICE
    state.food += 3
    addLog('买了 3 份香香宠物粮')
    commit('饲料放进背包啦')
  }
  function feedPet(id) {
    const pet = state.pets.find(item => item.id === id)
    if (!pet || state.food < 1) return showToast('背包里没有饲料啦')
    state.food -= 1
    pet.satiety = Math.min(100, pet.satiety + 32)
    pet.happiness = Math.min(100, pet.happiness + 6)
    addLog(`给${pet.name}喂了一份饲料`)
    commit(`${pet.name}吃得很开心`)
  }
  function playPet(id, cost, outing) {
    const pet = state.pets.find(item => item.id === id)
    if (!pet) return
    if (state.points < cost) return showToast('积分还不够，完成作业再来玩吧')
    state.points -= cost
    pet.happiness = Math.min(100, pet.happiness + (cost === 20 ? 26 : 18))
    pet.satiety = Math.max(0, pet.satiety - 8)
    pet.playCount += 1
    addLog(`带${pet.name}去了${outing}，花费 ${cost} 积分`)
    commit(`${pet.name}玩得很开心！`)
  }
  function exportBackup() {
    const blob = new Blob([JSON.stringify({ format: 'homework-pet-web', version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `作业小宠物备份-${new Date().toISOString().slice(0, 10)}.json`
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    showToast('备份文件已下载')
  }
  function importBackup(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''))
        const backup = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed
        if (!backup || !Array.isArray(backup.tasks) || !Array.isArray(backup.pets) || !Number.isFinite(Number(backup.points))) throw new Error('invalid')
        if (!window.confirm('导入会替换此浏览器里的当前数据，确定继续吗？')) return
        state = normalizeImportedState(backup)
        commit('备份恢复成功')
      } catch (_) {
        showToast('文件格式不正确，无法恢复')
      } finally {
        importFile.value = ''
      }
    }
    reader.onerror = () => showToast('读取文件失败，请重试')
    reader.readAsText(file)
  }
  function normalizeImportedState(source) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(source))
      return loadState()
    } catch (_) {
      return emptyState()
    }
  }
  function resetData() {
    if (!window.confirm('清空后，这台浏览器里的任务、积分和宠物记录都会删除。建议先下载备份。确定清空吗？')) return
    state = emptyState()
    saveState()
    render()
    showToast('本机数据已清空')
  }

  document.addEventListener('click', event => {
    const viewButton = event.target.closest('[data-view]')
    if (viewButton) {
      event.preventDefault()
      currentView = viewButton.dataset.view
      render()
      main.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const button = event.target.closest('[data-action]')
    if (!button) return
    const action = button.dataset.action
    if (action === 'complete-task') completeTask(button.dataset.id)
    if (action === 'delete-task') deleteTask(button.dataset.id)
    if (action === 'adopt') adoptPet(button.dataset.id)
    if (action === 'buy-food') buyFood()
    if (action === 'feed-pet') feedPet(button.dataset.id)
    if (action === 'play-pet') playPet(button.dataset.id, Number(button.dataset.cost), button.dataset.outing)
    if (action === 'export') exportBackup()
    if (action === 'import') importFile.click()
    if (action === 'reset') resetData()
  })
  document.addEventListener('submit', event => {
    if (event.target.id !== 'task-form') return
    event.preventDefault()
    addTask(event.target)
  })
  importFile.addEventListener('change', event => importBackup(event.target.files?.[0]))
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) {
      state = loadState()
      render()
      showToast('这个浏览器中的数据已更新')
    }
  })

  render()
})()
