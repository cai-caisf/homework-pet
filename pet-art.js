(() => {
  'use strict'
  const themes = {
    dog: { home: '暖暖客厅', park: '林荫公园', playground: '狗狗乐园' },
    cat: { home: '窗边小屋', park: '花间公园', playground: '攀爬乐园' },
    rabbit: { home: '花园小屋', park: '草地公园', playground: '洞洞乐园' },
    panda: { home: '竹林小屋', park: '竹林公园', playground: '竹球乐园' },
    penguin: { home: '冰雪小屋', park: '冰湖公园', playground: '冰雪乐园' },
    turtle: { home: '池塘小院', park: '荷塘公园', playground: '彩石乐园' }
  }
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
  const sceneSvg = (kind, place, body) => `<svg class="room-artwork ${place === 'home' ? '' : 'outdoor-artwork'}" data-pet-scenery="${kind}-${place}" viewBox="0 0 720 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`
  const flowers = (color = '#f0c2c8') => `<g stroke="#8ca779" stroke-width="3"><path d="M117 549V523M600 570V544M160 598V577M558 605V580"/></g><g fill="${color}" stroke="#d5b19d" stroke-width="2"><circle cx="117" cy="519" r="11"/><circle cx="600" cy="540" r="11"/><circle cx="160" cy="574" r="9"/><circle cx="558" cy="577" r="10"/></g><g fill="#f1d78f"><circle cx="117" cy="519" r="4"/><circle cx="600" cy="540" r="4"/><circle cx="160" cy="574" r="3"/><circle cx="558" cy="577" r="4"/></g>`
  // These choices derive only from the saved identity, never from render time or array order.
  const coats = {
    dog: [
      ['#edc48a', '#aa7147', '#d6a36c', '#fff4df'], ['#b88665', '#73503f', '#8f604b', '#f7e7d2'],
      ['#f6eee2', '#b08259', '#c39b71', '#fffaf1'], ['#aab5bf', '#687583', '#8796a4', '#f1f3ed'],
      ['#db9e65', '#a2643e', '#be7d4c', '#fff0da'], ['#eee0be', '#b09e7b', '#c9b68d', '#fff9e8']
    ],
    cat: [
      ['#e5a86e', '#bc7c4c', '#bc7c4c', '#fff4df'], ['#aeb8c2', '#697b8a', '#778995', '#f5f6f0'],
      ['#f5eee2', '#c49161', '#b78357', '#fffaf1'], ['#6d6b77', '#484650', '#45444e', '#dedde3'],
      ['#bf956d', '#866246', '#94704f', '#f8ebd6'], ['#e9cfac', '#ba9b78', '#c0a17f', '#fff9ed']
    ],
    rabbit: [
      ['#fff7e8', '#e9bdb6', '#dcc5b0', '#edddd0'], ['#b7b4c1', '#d6b0bd', '#918c9f', '#ece5ed'],
      ['#d9b387', '#d8aaa3', '#b0865d', '#fff0d8'], ['#7a7478', '#c799aa', '#574f59', '#d8cbd1'],
      ['#f1e2c2', '#dfb6ab', '#c9b18a', '#fff9e6'], ['#ae8c76', '#d4a49e', '#866650', '#f5e3d1']
    ],
    panda: [
      ['#faf4e5', '#9a9691', '#51595a', '#f8eedc'], ['#f1eee5', '#9f9ba7', '#626073', '#f6eee5'],
      ['#fff2df', '#b4a18a', '#776659', '#fff4e7'], ['#f2f4ec', '#8d9e9a', '#4c6562', '#f5f4e5'],
      ['#f9eee9', '#ba9ca2', '#80646e', '#fff1eb'], ['#f4f0db', '#aba587', '#6c6d54', '#fff7de']
    ],
    penguin: [
      ['#6d8799', '#e5bb7c', '#536c82', '#fff6de'], ['#8a819c', '#e2b38c', '#6f6487', '#fff1e3'],
      ['#748d83', '#d5b785', '#536e63', '#f6f6e6'], ['#8b9fb4', '#e1b281', '#667d98', '#fcf6e8'],
      ['#957f88', '#e7bf88', '#785e71', '#fff1e3'], ['#7b8b9d', '#dcb979', '#52677f', '#f6f5df']
    ],
    turtle: [
      ['#b6cd9c', '#d4dfb7', '#8dab7a', '#bfd1a0'], ['#b8d1b3', '#d5e7c5', '#769c86', '#b6d0b3'],
      ['#c9cca1', '#e3e0be', '#a5aa75', '#d1d2a4'], ['#a6c2b1', '#cee2c6', '#6b9786', '#b2cbb4'],
      ['#ceba99', '#e6d6b6', '#ac9771', '#d5c19b'], ['#b5c2a2', '#d9ddbd', '#8e9b79', '#c3cca9']
    ]
  }
  const roomColors = [
    ['#f8edda', '#dec3a2', '#e8c18e', '#b59571'], ['#e8eff5', '#c5d3dd', '#adc7d7', '#829cad'],
    ['#f5e8ed', '#dfc7ce', '#ddb5c1', '#b58e9c'], ['#eaf1df', '#ccd7b6', '#b9c79b', '#90a47d'],
    ['#eee8f6', '#d2c6e0', '#c5b5dc', '#9e8cb4'], ['#fff0df', '#e9c9ac', '#e6b58c', '#b68e70']
  ]
  function profile(pet, kind) {
    const number = Number.isSafeInteger(pet.individuality?.number) && pet.individuality.number > 0 ? pet.individuality.number : 1
    const index = number - 1, [fur, ear, patch, belly] = coats[kind][index % coats[kind].length]
    const wildRooms = { panda: ['竹林小屋', '青竹客厅', '竹叶小院', '暖竹阁'], penguin: ['冰雪小屋', '极光冰屋', '雪花客厅', '冰湖小筑'], turtle: ['池塘小院', '荷叶小院', '彩石庭院', '水莲小筑'] }
    return { number, fur, ear, patch, belly, pattern: (index + Math.floor(index / 6)) % 3, accessory: (index + Math.floor(index / 18)) % 3,
      accent: ['#7d9f96', '#d59c8b', '#9c9ac5', '#d0ac63', '#8eaf7a', '#b58ea6'][(index + Math.floor(index / 6)) % 6],
      room: roomColors[(index + ({ cat: 4, rabbit: 3, panda: 3, penguin: 1, turtle: 3 }[kind] || 0)) % roomColors.length],
      layout: (number - 2) % 4,
      homeLabel: wildRooms[kind] ? wildRooms[kind][index % 4] : number === 1 ? themes[kind].home : ['星光帐篷屋', '书香小屋', '花窗小屋', '积木小屋'][(number - 2) % 4]
    }
  }
  function finishAnimal(svg, pet, kind) {
    const p = profile(pet, kind), colors = {}
    const map = (list, color) => list.forEach(key => { colors[key] = color })
    if (kind === 'dog') {
      map(['#edc48a'], p.fur); map(['#aa7147', '#b7804e', '#b7814e'], p.ear)
      map(['#d6a36c', '#d8a771'], p.patch); map(['#fff4df', '#fff2dd'], p.belly)
    } else if (kind === 'cat') {
      map(['#e5a86e'], p.fur); map(['#a6744d', '#a5744c', '#bd7d4d', '#bc7d4c', '#bc7c4c', '#bd7d4c'], p.patch)
      map(['#fff4df', '#fff2dd'], p.belly)
    } else {
      map(['#fff7e8', '#fff8eb', '#fff8ee'], p.fur); map(['#edddd0', '#f0e3d4'], p.belly)
      map(['#e9bdb6', '#eab9af'], p.ear)
    }
    return svg.replace(/#[0-9a-f]{6}\b/gi, color => colors[color] || color)
      .replace('<svg ', `<svg data-pet-look="${kind}-${p.number}" `)
  }
  function markings(pet, kind, sleeping = false) {
    const p = profile(pet, kind)
    const marks = p.pattern === 1
      ? `<path d="M156 100Q171 90 184 101L181 130Q170 141 159 130Z" fill="${p.belly}"/><ellipse cx="104" cy="145" rx="14" ry="20" fill="${p.patch}"/>`
      : p.pattern === 2
        ? `<path d="M106 112Q127 95 143 107Q149 119 139 133Q118 144 106 127Z" fill="${p.patch}"/><circle cx="228" cy="158" r="10" fill="${p.patch}"/>`
        : kind === 'rabbit' ? `<path d="M164 104Q172 99 180 104L177 125Q171 133 166 125Z" fill="${p.belly}"/>` : ''
    return `<g class="pet-personal-markings" stroke="none"${sleeping ? ' transform="translate(-33 3) scale(1 .98)"' : ''}>${marks}</g>`
  }
  function accessory(pet, kind, sleeping = false) {
    const p = profile(pet, kind)
    const shape = p.accessory === 0
      ? '<path d="M135 218Q170 232 205 218L177 256Q170 261 163 254Z"/>'
      : p.accessory === 1
        ? '<path d="M165 230Q133 207 133 232Q134 249 165 236Q205 255 207 232Q205 209 175 230Z"/><circle cx="170" cy="233" r="9"/>'
        : '<path d="M137 220Q170 230 203 220L201 233Q169 243 139 233Z"/>'
    return `<g class="pet-personal-accessory"${sleeping ? ' transform="translate(68 12) rotate(-12 170 235) scale(.8)"' : ''} fill="${p.accent}" stroke="#806e61" stroke-width="2.5">${shape}<circle cx="170" cy="240" r="10" fill="#fff3c9"/><text x="170" y="244" text-anchor="middle" stroke="none" fill="#78623d" font-size="${p.number > 99 ? 7 : 10}" font-family="sans-serif" font-weight="700">${p.number}</text></g>`
  }
  function personalHome(pet, kind, original = '') {
    const p = profile(pet, kind)
    const sign = `<g class="personal-home-sign"><rect x="302" y="215" width="116" height="49" rx="12" fill="#fffaf0" stroke="${p.accent}" stroke-width="3"/><text x="360" y="236" text-anchor="middle" fill="#8f795f" font-family="sans-serif" font-size="10">${p.number} 号小家</text><text x="360" y="254" text-anchor="middle" fill="#745e49" font-family="sans-serif" font-size="15" font-weight="700" textLength="${Math.min(95, pet.name.length * 15)}" lengthAdjust="spacingAndGlyphs">${escape(pet.name)}</text></g>`
    if (!original && isWild(kind)) original = wildHome(kind, p)
    if (original) return original.replace('<svg ', `<svg data-home-owner="${kind}-${p.number}" `).replace('</svg>', `${sign}</svg>`)
    const [wall, floor, cloth, edge] = p.room
    const windowArt = (x, y, round = false) => `<g transform="translate(${x} ${y})" stroke="${edge}" stroke-width="5"><rect width="150" height="170" rx="${round ? 65 : 10}" fill="#c8e3ed"/><circle cx="112" cy="42" r="21" fill="#ffe6a2" stroke="none"/><path class="room-cloud" d="M9 94Q17 73 34 85Q49 60 65 84Q89 80 97 101H9" fill="#fffdf6" stroke="none"/><path d="M75 3V167M3 100H147"/><path d="M-12 -8H162" stroke-width="8"/><path d="M-8 0H18L10 145L-8 154ZM133 0H158V154L140 145Z" fill="${cloth}" stroke-width="2"/></g>`
    const shelf = `<g stroke="${edge}" stroke-width="4"><rect x="102" y="203" width="145" height="217" rx="13" fill="#faf3e4"/><path d="M107 277H242M107 349H242"/><g stroke-width="2"><rect x="116" y="228" width="23" height="48" rx="3" fill="${cloth}"/><rect x="143" y="219" width="18" height="57" rx="3" fill="#b2c4aa"/><path d="M167 232L189 226L204 271L183 277Z" fill="#d8ac94"/><rect x="116" y="300" width="115" height="27" rx="8" fill="${cloth}"/><circle cx="175" cy="383" r="22" fill="#e7ce8c"/></g></g>`
    const furniture = [
      `<g stroke="${edge}" stroke-width="5" stroke-linejoin="round"><path d="M83 417L181 210L280 417Z" fill="${cloth}"/><path d="M181 231L135 417H228Z" fill="#faf3dd"/><path d="M181 211V180" stroke-width="7"/><path d="M181 180L218 192L181 202Z" fill="#e3b476"/><path d="M125 414Q181 386 238 414" fill="none"/><path d="M145 294L181 309L218 294" fill="none" stroke="#fff6d5" stroke-width="4"/><circle cx="181" cy="309" r="7" fill="#f4d17c"/></g>${windowArt(480, 168)}`,
      `${shelf}${windowArt(470, 158, true)}<g stroke="${edge}" stroke-width="4"><rect x="457" y="356" width="188" height="59" rx="22" fill="${cloth}"/><path d="M473 412V436M629 412V436"/><path d="M467 362Q491 337 516 363" fill="#fff3dc"/></g>`,
      `${windowArt(106, 160, true)}<g stroke="${edge}" stroke-width="4"><path d="M470 414V291Q545 211 622 291V414Z" fill="${cloth}"/><path d="M491 414V314Q545 259 600 314V414Z" fill="#fff5e7"/><ellipse cx="545" cy="410" rx="53" ry="13" fill="#d6b8a1"/><path d="M510 264Q544 237 582 264" fill="none" stroke="#fff4d5"/></g><g fill="#9ab38a" stroke="#7e996f" stroke-width="3"><path d="M616 250Q650 220 655 252Q644 273 616 250ZM628 270Q663 265 660 293Q638 309 628 270Z"/></g>`,
      `${windowArt(458, 152)}<g stroke="${edge}" stroke-width="4" stroke-linejoin="round"><rect x="94" y="315" width="174" height="103" rx="13" fill="${cloth}"/><path d="M82 316L180 239L278 316Z" fill="#fff3d8"/><path d="M140 418V364Q178 330 216 364V418Z" fill="#bda48f"/><rect x="91" y="426" width="43" height="34" rx="6" fill="#e6b78d"/><rect x="139" y="429" width="35" height="32" rx="6" fill="#a8bebc"/><path d="M95 426L113 402L133 426Z" fill="#d7c3df"/></g>`
    ][p.layout]
    const keepsake = kind === 'cat' ? `<g transform="translate(590 500)">${toy('cat').replace('<svg ', '<svg width="59" height="59" ')}</g>`
      : kind === 'rabbit' ? '<g stroke="#b88f60" stroke-width="3"><path d="M112 512L148 517L122 567Z" fill="#e7b375"/><path d="M129 515L117 494M129 515L138 490M129 515L151 498" stroke="#8da774" stroke-width="5"/></g>'
        : '<path d="M577 525Q559 505 554 524Q546 542 568 545L620 545Q642 556 639 537Q648 514 628 519L620 526Z" fill="#e4b9bc" stroke="#b38a86" stroke-width="3"/>'
    return sceneSvg(kind, 'home', `<rect width="720" height="650" fill="${wall}"/><g stroke="${edge}" opacity=".12" stroke-width="2"><path d="M0 120H720M0 200H720M0 280H720M0 360H720"/></g><path d="M0 415H720V650H0Z" fill="${floor}"/><path d="M0 415H720" stroke="${edge}" stroke-width="7"/><g stroke="${edge}" opacity=".3" stroke-width="2"><path d="M0 466H720M0 516H720M0 566H720M0 616H720M130 415V466M480 415V466M270 466V516M620 466V516M120 516V566M470 516V566M300 566V616M650 566V616"/></g>${furniture}<ellipse cx="360" cy="550" rx="180" ry="56" fill="${cloth}" stroke="${edge}" stroke-width="3"/><ellipse cx="360" cy="550" rx="158" ry="40" fill="none" stroke="#fff5e6" stroke-width="3" stroke-dasharray="6 8"/>${keepsake}${sign}`).replace('<svg ', `<svg data-home-owner="${kind}-${p.number}" data-home-layout="${p.layout}" `)
  }

  const isWild = kind => ['panda', 'penguin', 'turtle'].includes(kind)
  function wildEyes(x1 = 136, x2 = 204, y = 153, sleeping = false) {
    if (sleeping) return `<g fill="none" stroke="#514b47" stroke-width="3.5"><path d="M${x1 - 8} ${y}q8 9 16 0M${x2 - 8} ${y}q8 9 16 0"/></g>`
    return `<g class="pet-eyes" fill="#343d3f" stroke="none"><ellipse cx="${x1}" cy="${y}" rx="8" ry="10"/><ellipse cx="${x2}" cy="${y}" rx="8" ry="10"/><circle cx="${x1 + 2}" cy="${y - 3}" r="2.5" fill="#fff"/><circle cx="${x2 + 2}" cy="${y - 3}" r="2.5" fill="#fff"/></g><g class="pet-eating-eyes" fill="none" stroke="#44494a" stroke-width="3.5"><path d="M${x1 - 8} ${y}q8 -9 16 0M${x2 - 8} ${y}q8 -9 16 0"/></g>`
  }
  function wildMouth(x = 170, y = 191, color = '#ad7c62') {
    return `<path class="pet-mouth-idle" d="M${x - 9} ${y}q9 10 18 0" fill="none" stroke="#6b6255" stroke-width="3"/><ellipse class="pet-mouth-chew" cx="${x}" cy="${y + 1}" rx="9" ry="6" fill="${color}" stroke-width="2"/>`
  }
  function wildBadge(p, x, y) {
    return `<g class="pet-personal-accessory"><circle cx="${x}" cy="${y}" r="13" fill="${p.accent}" stroke="#7d806c" stroke-width="2"/><text x="${x}" y="${y + 4}" text-anchor="middle" fill="#fffdf0" stroke="none" font-size="${p.number > 99 ? 8 : 12}" font-weight="700" font-family="sans-serif">${p.number}</text></g>`
  }
  function wildAnimal(pet, kind, sleeping = false) {
    const p = profile(pet, kind), stroke = '#726c5d'
    if (sleeping) {
      let animal
      if (kind === 'panda') animal = `<g class="sleeping-body"><ellipse cx="250" cy="174" rx="107" ry="53" fill="${p.fur}"/><ellipse cx="316" cy="184" rx="35" ry="39" fill="${p.patch}"/><ellipse cx="191" cy="203" rx="42" ry="17" fill="${p.patch}"/><ellipse cx="315" cy="212" rx="39" ry="14" fill="${p.patch}"/></g><circle cx="84" cy="138" r="20" fill="${p.patch}"/><circle cx="170" cy="139" r="20" fill="${p.patch}"/><ellipse cx="128" cy="175" rx="63" ry="49" fill="${p.fur}"/><ellipse cx="104" cy="172" rx="18" ry="23" fill="${p.patch}" transform="rotate(18 104 172)"/><ellipse cx="151" cy="172" rx="18" ry="23" fill="${p.patch}" transform="rotate(-18 151 172)"/>${wildEyes(104, 151, 171, true)}<ellipse cx="127" cy="192" rx="9" ry="5" fill="#414949" stroke="none"/><path d="M119 203q8 5 16 0" fill="none" stroke-width="2.5"/><ellipse cx="102" cy="217" rx="32" ry="12" fill="${p.patch}"/><ellipse cx="159" cy="217" rx="31" ry="12" fill="${p.patch}"/>${wildBadge(p, 249, 188)}`
      else if (kind === 'penguin') animal = `<g class="sleeping-body"><ellipse cx="249" cy="171" rx="112" ry="54" fill="${p.fur}"/><ellipse cx="244" cy="190" rx="90" ry="31" fill="${p.belly}"/><path d="M190 155q65 -25 106 31q-58 14 -106 -31Z" fill="${p.patch}"/><ellipse cx="345" cy="209" rx="27" ry="12" fill="${p.ear}"/></g><ellipse cx="125" cy="170" rx="61" ry="51" fill="${p.fur}"/><path d="M76 171q4 -47 47 -27q41 -23 53 27q-2 39 -49 42q-44 -1 -51 -42Z" fill="${p.belly}" stroke="none"/>${wildEyes(104, 146, 171, true)}<path d="M115 185q12 -6 23 0l-11 12Z" fill="${p.ear}" stroke-width="2"/>${wildBadge(p, 236, 187)}`
      else animal = `<g class="sleeping-body"><ellipse cx="253" cy="168" rx="111" ry="59" fill="${p.patch}"/><path d="M251 115l43 25v40l-43 27l-43 -27v-40Z" fill="${p.belly}"/><path d="M208 141l-41 -4M208 180l-47 19M294 140l39 -6M294 180l52 18M251 207v17" fill="none" stroke="#7c976c" stroke-width="4"/><ellipse cx="186" cy="214" rx="29" ry="13" fill="${p.fur}"/><ellipse cx="322" cy="214" rx="29" ry="13" fill="${p.fur}"/></g><path d="M157 184q-35 -28 -73 -12q-25 14 -10 36q26 24 76 -2Z" fill="${p.fur}"/>${wildEyes(95, 123, 189, true)}<path d="M100 205q10 5 20 0" fill="none" stroke-width="2.5"/>${wildBadge(p, 259, 169)}`
      return `<svg class="sleeping-pet-character pet-character-${kind}" data-pose="prone" data-animal="${kind}" data-pet-look="${kind}-${p.number}" viewBox="0 0 420 260" role="img" aria-label="${escape(pet.name)}趴卧睡觉的${escape(pet.species)}形象"><ellipse cx="210" cy="234" rx="180" ry="15" fill="#53685820"/><ellipse cx="210" cy="228" rx="178" ry="22" fill="${p.room[2]}" stroke="${p.accent}" stroke-width="3"/><g stroke="${stroke}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${animal}</g></svg>`
    }
    let body, head
    if (kind === 'panda') {
      body = `<g class="pet-tail"><circle cx="236" cy="263" r="18" fill="${p.fur}"/></g><g class="pet-body"><ellipse cx="170" cy="249" rx="69" ry="64" fill="${p.patch}"/><ellipse cx="170" cy="245" rx="47" ry="50" fill="${p.fur}" stroke="none"/><g class="pet-paw pet-paw-back-left"><ellipse cx="120" cy="299" rx="32" ry="19" fill="${p.patch}"/><ellipse cx="120" cy="300" rx="14" ry="9" fill="${p.ear}" stroke="none"/></g><g class="pet-paw pet-paw-back-right"><ellipse cx="221" cy="299" rx="32" ry="19" fill="${p.patch}"/><ellipse cx="221" cy="300" rx="14" ry="9" fill="${p.ear}" stroke="none"/></g><path class="pet-paw pet-paw-front-left" d="M120 225q-26 22 -13 53q13 20 28 3l14 -37Z" fill="${p.patch}"/><path class="pet-paw pet-paw-front-right" d="M219 225q27 22 13 53q-13 20 -28 3l-14 -37Z" fill="${p.patch}"/></g>${accessory(pet, kind)}`
      head = `<g class="pet-ear pet-ear-left"><circle cx="104" cy="83" r="29" fill="${p.patch}"/><circle cx="104" cy="83" r="14" fill="${p.ear}" stroke="none"/></g><g class="pet-ear pet-ear-right"><circle cx="236" cy="83" r="29" fill="${p.patch}"/><circle cx="236" cy="83" r="14" fill="${p.ear}" stroke="none"/></g><path d="M88 138q-4 -67 82 -66q87 0 82 66q16 74 -82 87q-96 -10 -82 -87Z" fill="${p.fur}"/><ellipse cx="133" cy="145" rx="23" ry="31" fill="${p.patch}" stroke="none" transform="rotate(24 133 145)"/><ellipse cx="207" cy="145" rx="23" ry="31" fill="${p.patch}" stroke="none" transform="rotate(-24 207 145)"/>${wildEyes()}<ellipse cx="112" cy="180" rx="12" ry="7" fill="#e8aaa1" opacity=".6" stroke="none"/><ellipse cx="228" cy="180" rx="12" ry="7" fill="#e8aaa1" opacity=".6" stroke="none"/><path d="M159 173q11 -7 22 0q-2 10 -11 11q-10 -2 -11 -11Z" fill="${p.patch}" stroke="none"/>${wildMouth()}`
    } else if (kind === 'penguin') {
      body = `<g class="pet-tail"><path d="M224 265l35 20l-37 9Z" fill="${p.fur}"/></g><g class="pet-body"><ellipse cx="170" cy="243" rx="72" ry="72" fill="${p.fur}"/><ellipse cx="170" cy="248" rx="51" ry="59" fill="${p.belly}" stroke="none"/><g class="pet-paw pet-paw-back-left"><path d="M111 297q12 -11 27 0l12 16q-30 14 -50 -1Z" fill="${p.ear}"/></g><g class="pet-paw pet-paw-back-right"><path d="M202 297q14 -11 27 0l11 16q-24 12 -50 0Z" fill="${p.ear}"/></g><path class="pet-paw pet-paw-front-left pet-flipper" d="M110 211q-35 6 -36 54q-1 18 15 8q20 -12 33 -42Z" fill="${p.fur}"/><path class="pet-paw pet-paw-front-right pet-flipper" d="M229 211q36 6 37 54q1 18 -15 8q-20 -12 -33 -42Z" fill="${p.fur}"/></g>${accessory(pet, kind)}`
      head = `<path d="M95 149q-3 -81 75 -82q80 0 75 82q12 74 -75 80q-89 -5 -75 -80Z" fill="${p.fur}"/><path d="M111 153q-4 -55 35 -48q16 3 24 17q9 -15 25 -17q39 -6 34 48q12 55 -59 64q-71 -9 -59 -64Z" fill="${p.belly}" stroke="none"/><path d="M159 72q-5 -22 9 -18q8 2 6 18M173 72q10 -20 19 -11" fill="none" stroke="${p.fur}" stroke-width="8"/>${wildEyes()}<ellipse cx="117" cy="177" rx="10" ry="6" fill="#edb4a0" opacity=".8" stroke="none"/><ellipse cx="224" cy="177" rx="10" ry="6" fill="#edb4a0" opacity=".8" stroke="none"/><path d="M156 173q14 -10 28 0l-14 15Z" fill="${p.ear}" stroke-width="2"/>${wildMouth(170, 195, p.ear)}`
    } else {
      body = `<g class="pet-tail"><path d="M272 239l34 19l-39 3Z" fill="${p.fur}"/></g><g class="pet-body"><g class="pet-paw pet-paw-back-left"><ellipse cx="141" cy="287" rx="26" ry="16" fill="${p.fur}"/></g><g class="pet-paw pet-paw-back-right"><ellipse cx="246" cy="287" rx="27" ry="16" fill="${p.fur}"/></g><ellipse cx="193" cy="235" rx="91" ry="64" fill="${p.patch}"/><path d="M193 180l40 25v41l-40 25l-40 -25v-41Z" fill="${p.belly}"/><path d="M153 205l-34 -12M153 246l-42 17M233 205l37 -12M233 246l39 19M193 271v23" fill="none" stroke="#719269" stroke-width="4"/><path class="pet-paw pet-paw-front-right" d="M236 258q30 2 31 25q-10 17 -35 7Z" fill="${p.fur}"/><path class="pet-paw pet-paw-front-left" d="M140 257q-34 0 -35 26q12 17 38 7Z" fill="${p.fur}"/></g>${wildBadge(p, 201, 231)}`
      head = `<path d="M145 221q-11 -38 -48 -36q-47 0 -44 38q2 35 44 37q42 1 48 -39Z" fill="${p.fur}"/>${wildEyes(82, 116, 216)}<ellipse cx="67" cy="234" rx="9" ry="5" fill="#d7b6a0" opacity=".6" stroke="none"/><ellipse cx="131" cy="234" rx="9" ry="5" fill="#d7b6a0" opacity=".6" stroke="none"/>${wildMouth(99, 240, '#ad936d')}<path d="M75 196q10 -6 20 -4" fill="none" stroke="${p.ear}" stroke-width="5"/>`
    }
    return `<svg class="pet-character pet-character-${kind}" data-pet-look="${kind}-${p.number}" viewBox="0 0 340 340" role="img" aria-label="${escape(pet.name)}的动态${escape(pet.species)}形象"><g stroke="${stroke}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${body}<g class="pet-head">${head}</g></g></svg>`
  }
  function bamboo(x, y, h = 215) {
    return `<g transform="translate(${x} ${y})" stroke="#809968" stroke-width="3"><path d="M0 0v-${h}" stroke="#a4ba82" stroke-width="17"/><path d="M-9 -45h18M-9 -99h18M-9 -151h18M-9 -199h18"/><g fill="#9cb681"><path d="M0 -160q-50 -36 -45 -2q18 18 45 2ZM0 -123q45 -48 45 -15q-13 23 -45 15ZM0 -187q38 -38 43 -15q-12 25 -43 15Z"/></g></g>`
  }
  function wildHome(kind, provided = null) {
    const p = provided || profile({ individuality: { number: 1 } }, kind), shift = p.number % 2 ? 0 : 35
    let wall, floor, decor, rug
    if (kind === 'panda') {
      wall = p.number % 2 ? '#f0f1df' : '#e9efdf'; floor = '#d9c5a0'; rug = p.room[2]
      decor = `${bamboo(88 + shift, 420, 230)}${bamboo(140 + shift, 420, 265)}<g stroke="#9a9c77" stroke-width="5"><rect x="459" y="145" width="166" height="217" rx="65" fill="#c5dfdb"/><path d="M465 285q77 -72 154 0v70H465Z" fill="#bdd2ab" stroke="none"/><path d="M542 150v207M465 251h154"/><path d="M447 136h192" stroke-width="8"/><path d="M449 142h28l-6 156l-22 18M608 142h27v174l-21 -18" fill="${p.room[2]}" stroke-width="3"/><rect x="144" y="342" width="280" height="80" rx="25" fill="#c7b590"/><rect x="154" y="331" width="262" height="48" rx="20" fill="${p.accent}"/><path d="M166 420v22M404 420v22"/><rect x="187" y="313" width="72" height="60" rx="17" fill="#e5e4bd"/><rect x="274" y="313" width="76" height="60" rx="17" fill="${p.room[2]}"/></g><g transform="translate(594 381)">${toy('panda').replace('<svg ', '<svg width="60" height="60" ')}</g>`
    } else if (kind === 'penguin') {
      wall = p.number % 2 ? '#edf5f6' : '#e8eff9'; floor = '#c9e1e7'; rug = p.room[2]
      decor = `<g stroke="#8daeba" stroke-width="4"><path d="M95 426v-69q0 -91 99 -91q99 0 99 91v69Z" fill="#f7fcfa"/><path d="M109 324h168M98 361h192M97 399h194M147 281v43M228 279v45M121 325v36M188 324v37M258 324v37M150 362v37M227 362v37" fill="none" stroke="#d5e6e9" stroke-width="3"/><path d="M160 426v-52q34 -43 68 0v52Z" fill="#b5d3df"/><rect x="461" y="141" width="163" height="193" rx="64" fill="#c5dfef"/><path d="M468 284l47 -64l45 65l30 -38l28 37v43H468Z" fill="#f7ffff" stroke="none"/><path d="M542 145v182M467 248h151"/><circle cx="588" cy="179" r="19" fill="#fff2b4" stroke="none"/><rect x="455" y="363" width="190" height="61" rx="28" fill="#c7dce7"/><rect x="468" y="357" width="162" height="29" rx="13" fill="${p.accent}"/></g><path d="M337 131v42" stroke="#a4b8ba" stroke-width="3"/><g fill="#c1d9e2" stroke="#91abb8" stroke-width="3"><path d="M315 177q21 -24 44 0q-20 27 -44 0ZM358 177l15 -10v20Z"/></g>`
    } else {
      wall = p.number % 2 ? '#eff3df' : '#e8f0e3'; floor = '#e6d8b8'; rug = p.room[2]
      decor = `<g stroke="#94aa86" stroke-width="5"><circle cx="167" cy="236" r="73" fill="#c9dfe0"/><path d="M103 254q59 -68 127 0v43H103Z" fill="#c2d3a2" stroke="none"/><path d="M167 165v142M96 236h144"/><path d="M89 319h156" stroke-width="9"/><path d="M486 404v-85q-3 -35 34 -43q44 -8 49 43v85" fill="none" stroke="#b7b28f" stroke-width="13"/><path d="M572 403v-89q0 -30 22 -41" fill="none" stroke="#a6ba88" stroke-width="7"/></g><ellipse cx="438" cy="435" rx="229" ry="69" fill="#b7d6cb" stroke="#8fb8a7" stroke-width="4"/><ellipse class="pond-ripple" cx="452" cy="438" rx="190" ry="47" fill="none" stroke="#e1ece0" stroke-width="3"/><g fill="#afba96" stroke="#8c9c79" stroke-width="4"><ellipse cx="130" cy="409" rx="60" ry="24"/><ellipse cx="159" cy="384" rx="52" ry="24"/><ellipse cx="145" cy="362" rx="39" ry="19"/></g><g fill="#a5bf91" stroke="#87a67a" stroke-width="3"><path d="M539 437a51 20 0 1 1 -4 -1l15 1Z"/><path d="M435 468a39 15 0 1 1 -4 -1l14 1Z"/></g><g fill="#edc2c5" stroke="#c79d9e" stroke-width="2"><path d="M558 425q-27 -17 -7 -33q9 -21 18 0q20 16 -11 33Z"/></g><path d="M86 494q5 -50 25 -54M91 493q-12 -42 -29 -51" stroke="#9eb58b" stroke-width="5" fill="none"/>`
    }
    return sceneSvg(kind, 'home', `<rect width="720" height="650" fill="${wall}"/><path d="M0 416H720V650H0Z" fill="${floor}"/><path d="M0 416H720" stroke="${kind === 'penguin' ? '#b1ccd6' : '#b9b28e'}" stroke-width="7"/><g stroke="#afbc9b" opacity=".22" stroke-width="2"><path d="M0 465H720M0 515H720M0 565H720M0 615H720M160 416v49M490 416v49M310 465v50M90 515v50M560 515v50"/></g><g transform="translate(${shift / 4} 0)">${decor}</g><ellipse cx="360" cy="554" rx="182" ry="55" fill="${rug}" stroke="${p.accent}" stroke-width="3"/><ellipse cx="360" cy="554" rx="162" ry="39" fill="none" stroke="#fff9e9" stroke-width="3" stroke-dasharray="6 8"/>`).replace('<svg ', `<svg data-home-layout="wild-${p.number % 4}" `)
  }
  function wildOutdoor(kind, place) {
    const play = place === 'playground', ice = kind === 'penguin', turtle = kind === 'turtle'
    const sky = ice ? '#e6f1fb' : turtle ? '#edf2dc' : '#e9f2de', ground = ice ? '#e9f8fa' : turtle ? '#d3e2bd' : '#c7d9ae'
    let backdrop, equipment
    if (ice) {
      backdrop = '<path d="M0 367l136 -193l116 143l112 -162l164 190l112 -170l80 188V450H0Z" fill="#c5d9e6"/><path d="M87 242l49 -68l45 56l-24 -10l-21 16l-20 -15Z M324 213l40 -58l48 56l-28 -10l-20 17l-20 -15Z M596 238l44 -63l42 67l-28 -12l-17 13l-21 -12Z" fill="#fbffff"/><ellipse cx="373" cy="490" rx="318" ry="105" fill="#c3e0ec" stroke="#a3c7da" stroke-width="4"/><path class="pond-ripple" d="M123 504q197 -59 460 -5M164 546q205 -40 400 -8" fill="none" stroke="#effbff" stroke-width="4"/>'
      equipment = play ? '<g stroke="#8eafbf" stroke-width="5" stroke-linejoin="round"><path d="M107 429v-141h67v141" fill="#d6eaf1"/><path d="M174 285q104 20 123 130h-57q-14 -68 -66 -73Z" fill="#b1d5e6"/><path d="M116 324h47M116 360h47M116 396h47"/><path d="M491 433l78 -119l67 117" fill="none" stroke-width="15"/><path d="M489 435h150" stroke="#e2c787" stroke-width="12"/></g>' : '<g stroke="#9eb9c5" stroke-width="4"><rect x="119" y="358" width="147" height="24" rx="9" fill="#c0d5dc"/><path d="M138 382v42M248 382v42"/><path d="M531 421v-93M584 421v-122"/><path d="M531 329l46 16l-46 16M584 299l48 14l-48 17" fill="#e9c99d"/></g>'
    } else if (turtle) {
      backdrop = '<ellipse cx="436" cy="440" rx="260" ry="100" fill="#b3d5c6" stroke="#91b8a3" stroke-width="4"/><g fill="#a5c18c" stroke="#82a678" stroke-width="3"><path d="M523 430a57 24 0 1 1 -4 -1l18 1Z"/><path d="M350 452a39 17 0 1 1 -4 -1l15 1Z"/></g><path class="pond-ripple" d="M268 463q85 -35 159 -8M470 494q83 -19 150 -8" fill="none" stroke="#deecde" stroke-width="4"/><g fill="#ead8ab" stroke="#c5bb92" stroke-width="3"><ellipse cx="157" cy="423" rx="35" ry="14"/><ellipse cx="221" cy="462" rx="34" ry="15"/><ellipse cx="259" cy="510" rx="37" ry="17"/></g>'
      equipment = play ? '<g stroke="#a9a17e" stroke-width="5" stroke-linejoin="round"><path d="M101 396v-75q0 -61 62 -61q65 0 65 61v75" fill="#d5c5a1"/><path d="M125 397v-74q0 -36 39 -36q39 0 39 36v74" fill="#a9bd90"/><path d="M504 388l43 -52h81l-43 52Z" fill="#e0cda8"/><path d="M504 388v35M584 388v35M624 337v45"/><circle cx="580" cy="435" r="27" fill="#b9d1c2"/></g>' : '<g fill="#b8bc9b" stroke="#969f7f" stroke-width="4"><ellipse cx="111" cy="373" rx="68" ry="28"/><ellipse cx="119" cy="346" rx="49" ry="24"/></g><path d="M590 373q-14 -84 32 -118M612 391q30 -52 61 -43" fill="none" stroke="#94b380" stroke-width="8"/>'
    } else {
      backdrop = `${bamboo(74, 420, 246)}${bamboo(128, 419, 281)}${bamboo(616, 421, 247)}${bamboo(668, 422, 288)}<path d="M310 387q-64 57 -7 111q61 63 9 152h166q39 -96 -61 -161q-60 -40 -18 -102Z" fill="#e5dec0" stroke="#b8bd94" stroke-width="3"/>`
      equipment = play ? '<g stroke="#8ea377" stroke-width="5"><path d="M169 409v-131M248 409v-131M155 281h106" fill="none" stroke="#b7c38c" stroke-width="13"/><path d="M170 310h78M170 348h78M170 382h78"/><path d="M476 420l68 -100l75 100Z" fill="#c5ce9e"/><path d="M506 376h82M493 396h109"/><circle cx="558" cy="444" r="29" fill="#abc193"/></g>' : '<g stroke="#a49b77" stroke-width="5"><rect x="153" y="363" width="147" height="23" rx="9" fill="#d4c59c"/><path d="M173 387v42M281 387v42"/></g><g fill="#d9d0ae" stroke="#aaa484" stroke-width="3"><ellipse cx="539" cy="432" rx="51" ry="21"/><ellipse cx="569" cy="410" rx="36" ry="18"/></g>'
    }
    return sceneSvg(kind, place, `<rect width="720" height="650" fill="${sky}"/><circle cx="545" cy="120" r="29" fill="#f7dfa2"/><g class="outdoor-clouds" fill="#fffdf5"><path d="M121 185q-5 -29 22 -29q19 -35 40 -9q29 -13 36 19q23 -2 21 19Z"/></g><path d="M0 352q182 -62 357 3q181 -60 363 -1v296H0Z" fill="${ground}"/>${backdrop}${equipment}${!ice ? flowers(turtle ? '#eec4c8' : '#f6e6a7') : ''}`)
  }
  function wildToy(kind) {
    if (kind === 'panda') return '<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="31" fill="#bed09d" stroke="#7e9d68" stroke-width="4"/><path d="M23 14q25 24 8 55M43 9q27 30 13 58M10 32q30 14 62 3M13 49q27 15 56 4" fill="none" stroke="#8eae77" stroke-width="4"/><path d="M29 26l6 3M49 44l7 2" stroke="#f1edd0" stroke-width="3"/></svg>'
    if (kind === 'penguin') return '<svg viewBox="0 0 80 80"><g transform="rotate(-15 40 40)" stroke="#7e9faf" stroke-width="3"><path d="M11 33q28 -16 58 0v17q-28 16 -58 0Z" fill="#bcdaea"/><path d="M19 52v9M61 52v9M14 62h53" fill="none" stroke="#9cabb7" stroke-width="4"/><path d="M40 26v19M31 30l18 12M49 30L31 42" fill="none" stroke="#f9ffff" stroke-width="3"/></g></svg>'
    return '<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="30" fill="#c4d9bb" stroke="#91ac83" stroke-width="4"/><circle cx="27" cy="29" r="10" fill="#e5c5b7"/><circle cx="52" cy="26" r="9" fill="#b1cbd6"/><circle cx="45" cy="52" r="12" fill="#e7d495"/><path d="M12 43q26 -9 56 6" fill="none" stroke="#8eae87" stroke-width="3"/></svg>'
  }
  function wildSnack(kind) {
    if (kind === 'panda') return '<svg viewBox="0 0 80 80"><g stroke="#9da578" stroke-width="3" stroke-linejoin="round"><path d="M19 65q-1 -32 21 -54q24 27 23 54Z" fill="#e2d8a3"/><path d="M23 48l17 14l19 -14M29 32l12 13l11 -13M38 16l1 51" fill="none"/><path d="M42 22q22 -20 28 -2q-9 14 -28 2Z" fill="#a9c58c"/></g></svg>'
    if (kind === 'penguin') return '<svg viewBox="0 0 80 80"><g stroke="#8ca8ae" stroke-width="3" stroke-linejoin="round"><path d="M12 40q23 -31 48 -7l15 -13v39L60 46q-26 24 -48 -6Z" fill="#b7d6dd"/><path d="M42 24l9 -9l6 14M44 54l8 10l6 -14" fill="#d4e4dd"/><path d="M43 28q-12 13 0 25" fill="none"/><circle cx="26" cy="37" r="3" fill="#53696e" stroke="none"/></g></svg>'
    return '<svg viewBox="0 0 80 80"><g stroke="#89a878" stroke-width="3"><path d="M23 66q-26 -23 -6 -45q14 -16 24 2q16 -28 29 -4q10 19 -11 40q-13 13 -36 7Z" fill="#c4dca4"/><path d="M21 63q20 -31 40 -40M34 46l-13 -12M43 37l16 7M28 55l21 3" fill="none"/><path d="M20 65l-6 8" stroke-width="5" stroke-linecap="round"/></g><circle cx="29" cy="25" r="3" fill="#f9fff1" stroke="none"/></svg>'
  }

  function home(kind) {
    if (isWild(kind)) return wildHome(kind)
    if (kind === 'cat') return sceneSvg(kind, 'home', `<rect width="720" height="650" fill="#f4eef8"/><g stroke="#e8ddea" stroke-width="2"><path d="M80 0V418M180 0V418M280 0V418M380 0V418M480 0V418M580 0V418M680 0V418"/></g><path d="M0 415H720V650H0Z" fill="#decfe0"/><g stroke="#c8b7cb" stroke-width="3"><path d="M0 461H720M0 512H720M0 563H720M0 615H720M170 416V461M490 416V461M330 461V512M100 512V563M570 512V563M290 563V615"/></g>
      <g stroke="#a891ae" stroke-width="5" stroke-linejoin="round"><rect x="124" y="138" width="265" height="231" rx="40" fill="#d8c5df"/><rect x="139" y="153" width="235" height="200" rx="30" fill="#cee4f0"/><g stroke="none"><circle cx="314" cy="195" r="25" fill="#f6dfa1"/><path class="room-cloud" d="M145 249Q153 227 170 238Q179 210 202 229Q229 218 236 249Z" fill="#fbffff"/></g><path d="M255 153V353M139 260H374" stroke="#b5a1be"/><path d="M116 129H397" stroke-width="9" stroke-linecap="round"/><path d="M118 137H151L155 313L118 332ZM363 137H396V332L359 313Z" fill="#e9d8e9" stroke-width="3"/>
      <rect x="105" y="371" width="300" height="20" rx="8" fill="#d2b8c8"/><path d="M130 391V438M375 391V438"/><path d="M174 369V345H219V369" fill="#a9bfa9" stroke="#91a691" stroke-width="3"/><path d="M182 343Q170 316 187 311Q209 317 198 343M199 342Q218 313 231 328Q225 344 199 342" fill="#acc7a1" stroke="#91a691" stroke-width="3"/>
      <g fill="#d6c1a8" stroke="#a18e7e"><path d="M530 428V226" stroke-width="24"/><rect x="476" y="208" width="113" height="25" rx="12" fill="#c0cbb7"/><rect x="506" y="306" width="115" height="25" rx="12" fill="#d9bdd0"/><path d="M485 435V372Q527 331 571 372V435Z" fill="#d9c3ae"/><path d="M510 432V389Q528 365 547 389V432" fill="#ab9595"/><path d="M509 246L550 250M509 264L550 268M509 281L550 285" stroke="#c5ac91" stroke-width="6"/></g>
      <path d="M450 170V251" stroke="#ad99ae" stroke-width="3"/><path d="M430 238Q451 218 470 238Q451 259 430 238ZM470 238L487 225V251Z" fill="#d9b8ca" stroke="#ad99ae" stroke-width="3"/>
      <ellipse cx="359" cy="554" rx="181" ry="58" fill="#d8bbd1" stroke="#b69db4" stroke-width="3"/><ellipse cx="359" cy="554" rx="160" ry="43" fill="none" stroke="#eee0ea" stroke-width="3" stroke-dasharray="6 7"/>
      <g stroke="#a98ea7" stroke-width="3"><circle cx="122" cy="514" r="26" fill="#c1c6df"/><path d="M103 497Q147 509 107 531M118 488Q151 516 121 540M98 511L148 520" fill="none"/><path d="M144 532Q159 559 186 545" fill="none"/></g><g fill="#ecd9cb" stroke="#ba9c99" stroke-width="3"><path d="M574 513Q554 495 573 485Q585 480 599 493L624 483Q641 476 645 490Q649 503 632 510Q651 523 637 535Q623 545 609 529L586 540Q568 548 560 532Q554 520 574 513Z"/></g></g>`)
    return sceneSvg(kind, 'home', `<rect width="720" height="650" fill="#eef5df"/><path d="M0 415H720V650H0Z" fill="#d6dfb3"/><g stroke="#c3cd9d" stroke-width="2"><path d="M0 460H720M0 507H720M0 554H720M0 602H720M100 416V650M250 416V650M400 416V650M550 416V650M700 416V650"/></g>
      <g stroke="#94a77b" stroke-width="5" stroke-linejoin="round"><path d="M462 414V235Q462 141 557 141Q651 141 651 235V414Z" fill="#c9d7ae"/><path d="M478 407V238Q478 158 557 158Q635 158 635 238V407Z" fill="#cce6dc"/><path d="M478 322Q560 273 635 322V407H478Z" fill="#b5d19a" stroke="none"/><path d="M485 374H629M498 386V343L506 335L514 343V386M542 386V343L550 335L558 343V386M586 386V343L594 335L602 343V386" fill="#f5f0cf" stroke="#c6bc95" stroke-width="3"/>
      <circle cx="208" cy="237" r="75" fill="#c5d5b2"/><circle cx="208" cy="237" r="61" fill="#d6e9ed"/><path d="M208 176V298M147 237H269" stroke="#a4b58a" stroke-width="7"/><path d="M127 319H288" stroke="#b2bd95" stroke-width="10" stroke-linecap="round"/>
      <g fill="#98bb84" stroke="#7f9e6e" stroke-width="3"><path d="M453 158Q423 188 441 225Q455 194 453 158ZM480 137Q452 115 432 142Q455 157 480 137ZM642 155Q675 173 663 210Q646 185 642 155Z"/></g>
      <path d="M112 399Q173 356 244 399L235 447H123Z" fill="#dac498" stroke="#b79f72"/><path d="M120 413H239M124 429H236M145 394L147 445M175 385V446M208 394L207 445" stroke="#b79f72" stroke-width="3"/><ellipse cx="177" cy="397" rx="58" ry="14" fill="#f2e5bb" stroke="#c5b07d" stroke-width="3"/>
      <rect x="319" y="188" width="78" height="95" rx="10" fill="#ded6ae"/><rect x="329" y="198" width="58" height="75" rx="6" fill="#fff9df" stroke-width="2"/><path d="M346 227L369 229L352 261Z" fill="#e4af77" stroke="#bb9466" stroke-width="2"/><path d="M358 229L345 214M358 229L362 209M358 229L375 216" stroke="#8eaf79" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="360" cy="550" rx="175" ry="57" fill="#bbcc96" stroke="#96ad79" stroke-width="3"/><path d="M214 550H507M361 500V601M253 522L462 579M257 579L466 522" stroke="#dbe6bb" stroke-width="3"/>
      <g stroke="#8ea78b" stroke-width="4"><path d="M576 502H617L627 543H578Z" fill="#b6cdb5"/><path d="M583 501V487Q598 468 612 487V500M620 521L647 505L653 517L626 535" fill="none"/></g><path d="M123 537Q143 513 159 538L151 571Q137 589 125 572Z" fill="#e9bd81" stroke="#bd9c69" stroke-width="3"/><path d="M139 534L126 514M139 534L145 510M139 534L159 519" stroke="#8baa73" stroke-width="5" stroke-linecap="round"/></g>`)
  }
  function outdoor(kind, place) {
    if (isWild(kind)) return wildOutdoor(kind, place)
    const park = place === 'park', cat = kind === 'cat'
    const sky = cat ? '#eee9f5' : '#e5f3dc', grass = cat ? '#d3dfbb' : '#c3dda7'
    const trees = cat ? `<g class="outdoor-tree" stroke="#ba98a6" stroke-width="4"><path d="M110 412V268M619 412V263" stroke="#bca18b" stroke-width="16"/><path d="M38 283Q18 243 52 224Q33 185 72 175Q99 138 126 169Q168 147 183 188Q214 215 186 245Q201 280 165 293Z" fill="#e9c7d4"/><path d="M552 278Q534 245 561 225Q542 193 579 177Q601 141 630 167Q669 148 685 189Q715 217 689 247Q704 281 670 291Z" fill="#e7ccdf"/></g>` : `<g class="outdoor-tree" stroke="#91ad74" stroke-width="4"><path d="M72 365Q36 314 76 278Q57 235 104 227Q141 200 164 237Q214 235 210 285Q245 329 207 365Z" fill="#b1ce96"/><path d="M534 359Q505 314 547 277Q542 233 585 227Q629 198 652 242Q705 246 692 299Q726 342 683 366Z" fill="#a5c78c"/></g>`
    let equipment
    if (cat && park) equipment = `<path d="M303 373Q458 421 342 468Q256 509 310 650H495Q432 530 472 474Q536 404 374 373Z" fill="#ece0cf" stroke="#cdbdb1" stroke-width="3"/><g stroke="#c8b6ab" stroke-width="3" fill="#f8efdf"><ellipse cx="357" cy="407" rx="24" ry="10"/><ellipse cx="392" cy="445" rx="30" ry="12"/><ellipse cx="372" cy="497" rx="34" ry="14"/></g><g stroke="#aaa5b8" stroke-width="5"><path d="M565 400L553 451H591L578 400" fill="#c7c1d2"/><ellipse cx="571" cy="394" rx="52" ry="14" fill="#d7d7e1"/><path d="M547 389Q570 372 592 389" fill="none" stroke="#b5cbd3"/></g><g fill="#d8b6c7" stroke="#b793ab" stroke-width="4"><rect x="124" y="361" width="135" height="22" rx="8"/><path d="M141 384V428M241 384V428"/></g>`
    else if (cat) equipment = `<g stroke="#ad94b0" stroke-width="5" stroke-linejoin="round"><path d="M170 444V269M552 444V246" stroke="#cbb29e" stroke-width="20"/><rect x="110" y="250" width="125" height="24" rx="11" fill="#d9bfd7"/><rect x="488" y="228" width="125" height="25" rx="11" fill="#c5c8df"/><path d="M174 280Q359 368 552 255" fill="none" stroke="#d3bba5" stroke-width="14" stroke-dasharray="13 5"/><path d="M140 444V379Q169 345 201 379V444Z" fill="#e4cbd3"/><path d="M157 442V389Q170 372 185 389V442" fill="#ad98af"/><path d="M520 443V369Q550 332 584 369V443Z" fill="#c9c6db"/><path d="M538 441V380Q553 363 568 380V441" fill="#a59ebd"/><path d="M552 255V324" stroke-width="3"/><path d="M548 321Q572 306 569 331Q569 351 548 346Z" fill="#d8b4c7" stroke-width="3"/><path d="M267 200Q360 156 451 200V225Q360 185 267 225Z" fill="#f7ebd5" stroke="#cbb8ac"/></g>`
    else if (park) equipment = `<path d="M316 363Q244 419 306 468Q385 521 333 650H480Q505 523 390 463Q311 418 387 363Z" fill="#e2e9bf" stroke="#b4c792" stroke-width="3"/><g stroke="#ad9776" stroke-width="3"><path d="M484 414H627L613 459H497Z" fill="#c0a57e"/><path d="M494 428H620M504 440H616" fill="none"/><g fill="#e9b87d" stroke="#b88e61"><path d="M510 416L526 417L517 447ZM552 413L568 415L558 446ZM594 415L609 416L600 449Z"/></g><path d="M518 416L509 400M518 416L523 396M558 415L549 398M558 415L564 395M601 416L594 399M601 416L609 398" stroke="#82a56b" stroke-width="4" stroke-linecap="round"/></g><g fill="#eff5da" stroke="#b7cb9e" stroke-width="3"><path d="M109 406V357L118 346L127 357V406M146 406V357L155 346L164 357V406M183 406V357L192 346L201 357V406"/><path d="M106 371H205M106 394H205" fill="none" stroke-width="6"/></g>`
    else equipment = `<g stroke="#a4ad80" stroke-width="4" stroke-linejoin="round"><path d="M470 451V366Q470 304 532 304Q595 304 595 366V451Z" fill="#cbb995"/><path d="M496 447V374Q496 331 534 331Q570 331 570 374V447Z" fill="#8e9e78"/><path d="M503 308L553 311L526 361Z" fill="#edbf83" stroke="#bd9967" stroke-width="3"/><path d="M529 310L517 291M529 310L532 284M529 310L549 292" stroke="#8dad72" stroke-width="5" stroke-linecap="round"/><path d="M123 418L174 348H247L204 418Z" fill="#ddc59e"/><path d="M174 348V418M247 348V418M158 369L227 369M143 391H217" fill="none" stroke="#bda47f"/><ellipse cx="138" cy="456" rx="32" ry="12" fill="#b7c698"/><ellipse cx="204" cy="477" rx="32" ry="12" fill="#c3cba1"/><path d="M276 282Q358 198 442 282" fill="none" stroke="#dcb7ad" stroke-width="18"/><path d="M287 285Q358 215 430 285" fill="none" stroke="#f4dfaa" stroke-width="14"/><path d="M297 289Q358 231 420 289" fill="none" stroke="#b7cdb0" stroke-width="12"/></g>`
    return sceneSvg(kind, place, `<rect width="720" height="650" fill="${sky}"/><circle cx="534" cy="127" r="33" fill="#f3d994"/><g class="outdoor-clouds" fill="#fffdf5"><path d="M123 173Q113 148 138 139Q147 109 169 126Q199 109 210 143Q233 145 233 173Z"/><path d="M405 206Q403 181 426 179Q441 157 456 180Q485 172 491 206Z"/></g><path d="M0 351Q167 275 330 347Q501 271 720 348V650H0Z" fill="${grass}"/><path d="M0 449Q198 403 361 447Q531 408 720 450V650H0Z" fill="${cat ? '#e0e7c9' : '#d4e7bc'}"/>${trees}${equipment}${flowers(cat ? '#e8c1d5' : '#fff6cf')}<g stroke="#9eb681" stroke-width="3" fill="none"><path d="M95 602L88 590M95 602L104 590M640 513L634 502M640 513L650 501"/></g>`)
  }
  function toy(kind) {
    if (isWild(kind)) return wildToy(kind)
    if (kind === 'dog') return '<svg viewBox="0 0 80 80"><g transform="rotate(-20 40 40)" stroke="#ba8e91" stroke-width="3" stroke-linejoin="round"><path d="M22 29Q8 14 8 31Q3 43 19 45L61 45Q77 52 74 37Q81 22 65 26L61 31L22 31Z" fill="#e7bdc3"/><path d="M29 35H54M29 40H54" stroke="#fff0e6" stroke-linecap="round"/><circle cx="43" cy="35" r="3" fill="#cc929b" stroke="none"/></g></svg>'
    if (kind === 'cat') return '<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="32" fill="#c4b9dc" stroke="#9f91b3" stroke-width="4"/><g fill="none" stroke="#eee3f3" stroke-width="4"><path d="M15 23Q51 27 64 54M13 39Q43 31 62 20M27 11Q57 46 29 70M18 59Q52 41 70 39"/></g></svg>'
    return '<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="32" fill="#e7d5a0" stroke="#b5a275" stroke-width="4"/><path d="M27 31L54 35L34 59Z" fill="#e9b37c" stroke="#be966b" stroke-width="2"/><path d="M40 34L33 21M40 34L43 18M40 34L56 23" fill="none" stroke="#91ad78" stroke-width="4" stroke-linecap="round"/></svg>'
  }
  function snack(kind) {
    if (isWild(kind)) return wildSnack(kind)
    if (kind === 'dog') return '<svg viewBox="0 0 80 80"><g transform="rotate(-18 40 40)" stroke="#b38a55" stroke-width="3" stroke-linejoin="round"><path d="M23 30Q11 15 9 29Q3 42 20 45L60 45Q77 53 74 39Q81 23 66 27L60 31H23Z" fill="#e8c68b"/><g fill="#ba925c" stroke="none"><circle cx="29" cy="37" r="2"/><circle cx="43" cy="35" r="2"/><circle cx="54" cy="39" r="2"/></g></g></svg>'
    if (kind === 'cat') return '<svg viewBox="0 0 80 80"><g stroke="#b38b5c" stroke-width="3" stroke-linejoin="round"><path d="M15 40Q39 10 63 35L74 24V56L63 45Q40 69 15 40Z" fill="#edca90"/><path d="M40 23L46 15L51 27M39 56L46 64L51 53" fill="#e6bc7d"/><path d="M45 28Q35 40 45 53" fill="none"/><circle cx="28" cy="36" r="3" fill="#99704b" stroke="none"/><path d="M50 34L57 39L50 45" fill="none" stroke-width="2"/></g></svg>'
    return '<svg viewBox="0 0 80 80"><g stroke="#7c9e64" stroke-width="3" stroke-linejoin="round"><path d="M21 66Q1 43 20 20Q27 12 35 21Q44 3 55 15Q79 12 71 36Q78 60 51 65Z" fill="#b6d38f"/><path d="M23 62Q30 38 58 22M35 45L24 31M42 39L56 42M31 54L48 56" fill="none" stroke="#88ae6e" stroke-width="2.5"/><path d="M23 62L17 72" fill="none" stroke-width="5" stroke-linecap="round"/></g></svg>'
  }
  function sleeping(pet, kind) {
    if (isWild(kind)) return wildAnimal(pet, kind, true)
    const rabbit = kind === 'rabbit', cat = kind === 'cat', fur = rabbit ? '#fff7e8' : cat ? '#e5a86e' : '#edc48a'
    const ears = rabbit ? '<path d="M137 142Q158 91 222 105Q243 119 218 136L153 163Z" fill="#fff7e8"/><path d="M169 136Q193 107 222 118L178 145Z" fill="#e9bdb6" stroke="none"/><path d="M163 146Q215 81 280 113Q299 130 271 143L181 174Z" fill="#fff7e8"/><path d="M195 144Q238 110 275 126L210 155Z" fill="#e9bdb6" stroke="none"/>' : cat ? '<path d="M84 145L88 101Q91 91 103 104L128 129M151 128L178 103Q189 95 191 108L194 153" fill="#e5a86e"/><path d="M96 130L98 111L113 128M165 131L181 114L182 140" fill="#e5b3a1" stroke="none"/>' : '<path d="M91 129Q59 119 59 151L64 195Q70 217 90 201L109 156Z" fill="#aa7147"/><path d="M179 132Q206 118 212 151L207 197Q194 214 178 197L170 159Z" fill="#aa7147"/>'
    const tail = rabbit ? '<circle cx="354" cy="172" r="26" fill="#fff8ee"/>' : cat ? '<path d="M322 167Q383 157 376 199Q369 228 264 219" fill="none" stroke="#a5744c" stroke-width="30"/><path d="M322 167Q383 157 376 199Q369 228 264 219" fill="none" stroke="#e5a86e" stroke-width="23"/><path d="M351 167L353 188M375 190L354 199M337 218L334 200" stroke="#bc7c4c" stroke-width="6"/>' : '<path d="M317 180Q382 157 382 183Q380 207 335 208" fill="#b7814e"/>'
    return finishAnimal(`<svg class="sleeping-pet-character" data-pose="prone" data-animal="${kind}" viewBox="0 0 420 260" role="img" aria-label="${escape(pet.name)}趴卧睡觉的${escape(pet.species)}形象"><ellipse cx="210" cy="233" rx="177" ry="15" fill="#574c5126"/><ellipse cx="210" cy="221" rx="180" ry="25" fill="${cat ? '#c6b3d4' : rabbit ? '#b5c7a1' : '#a8c4b7'}" stroke="${cat ? '#a18bab' : rabbit ? '#8da478' : '#799b8a'}" stroke-width="4"/><g stroke="#825e45" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><g class="sleeping-body">${tail}<ellipse cx="252" cy="169" rx="111" ry="56" fill="${fur}"/>${cat ? '<path d="M246 117L240 139M274 118L268 142M301 125L293 145" stroke="#bc7c4c" stroke-width="8"/>' : rabbit ? '<ellipse cx="287" cy="190" rx="45" ry="23" fill="#f0e3d4" stroke="none"/>' : '<path d="M268 123Q317 116 337 152Q337 169 316 165Q292 148 273 146Z" fill="#d8a771" stroke="none"/>'}<ellipse cx="302" cy="205" rx="43" ry="15" fill="${fur}"/></g>${accessory(pet, kind, true)}${ears}<ellipse cx="137" cy="164" rx="${rabbit ? 66 : 67}" ry="${rabbit ? 48 : 53}" fill="${fur}"/>${markings(pet, kind, true)}${!rabbit ? '<ellipse cx="137" cy="183" rx="36" ry="24" fill="#fff2dd" stroke="none"/>' : ''}${cat ? '<path d="M125 116L128 131M140 113L140 132M154 117L151 132" stroke="#bd7d4c" stroke-width="6"/>' : ''}<ellipse cx="103" cy="210" rx="34" ry="14" fill="${rabbit ? fur : '#fff2dd'}"/><ellipse cx="165" cy="210" rx="34" ry="14" fill="${rabbit ? fur : '#fff2dd'}"/><path d="M92 211V216M104 211V216M154 211V216M166 211V216" stroke="#c3a789" stroke-width="2"/><g fill="none" stroke="#6d4e3a" stroke-width="4"><path d="M103 157Q114 168 125 157M150 157Q161 168 172 157"/></g><ellipse cx="97" cy="177" rx="10" ry="5" fill="#e8aa98" opacity=".55" stroke="none"/><ellipse cx="178" cy="177" rx="10" ry="5" fill="#e8aa98" opacity=".55" stroke="none"/><path d="M130 177Q137 172 144 177Q146 184 137 187Q128 184 130 177Z" fill="${kind === 'dog' ? '#674936' : '#ce9290'}" stroke="none"/><path d="M131 192Q137 196 143 192" fill="none" stroke-width="2.5"/>${cat ? '<path d="M94 179L66 175M94 187L65 192M181 180L207 174M182 188L209 193" fill="none" stroke="#a67553" stroke-width="2"/>' : ''}</g></svg>`, pet, kind)
  }
  window.PetArtwork = Object.freeze({ themes, home, outdoor, sleeping, toy, snack, profile, finishAnimal, markings, accessory, personalHome, wildAnimal })
})()
