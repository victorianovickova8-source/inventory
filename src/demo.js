(() => {
 'use strict';
 const $ = selector => document.querySelector(selector);
 const alphabet = [...'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ'];
 const sections = [
  ['inventory','Инвентаризация','Рабочая таблица и поля ввода','inventory'],
  ['writeoffs','Списания','Список и просмотр карточки','writeoffs'],
  ['acts','Акты проработок','Компоновка формы и таблицы','acts'],
  ['results','Результаты','Внешний вид архива','results'],
  ['review','Разбор инвентаризации','Вкладки, схемы и широкие таблицы','review'],
  ['regulations','Регламенты','Карточки материалов','regulations'],
  ['objects','Объекты','Выбор условного пространства','objects'],
  ['contacts','Контакты и обратная связь','Карточки и окно формы','contacts'],
  ['history','История изменений','Макет списка событий','history'],
  ['administration','Администрирование','Компоновка панелей','administration']
 ];
 const paths = {
  inventory:'M7 4h10v17H7z M10 2h4v4h-4z M10 10h4m-4 4h4m-4 3h3',
  writeoffs:'M6 3h9l4 4v14H6z M15 3v5h4 M9 12h7m-7 4h4',
  acts:'M9 3h6m-5 0v6l-5 9q-1 3 2 3h10q3 0 2-3l-5-9V3 M8 15h8',
  results:'M3 7h18v14H3z M3 7V3h7l3 4 M3 11h18',
  review:'M4 4h16v16H4z M8 7v10m4-10v10m4-10v10',
  regulations:'M12 5q-4-3-9-1v16q5-2 9 1 4-3 9-1V4q-5-2-9 1z M12 5v16',
  objects:'M3 8h18l-2-5H5z M5 8v13h14V8 M8 21v-8h8v8',
  contacts:'M4 4h16v13H9l-5 4z M8 8h8m-8 4h5',
  history:'M4 6v5h5 M4 10a8 8 0 1 1 2 8 M12 7v6l4 2',
  administration:'M4 6h16M4 12h16M4 18h16 M8 3v6m8 0v6m-6 0v6'
 };
 const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.inventory}"/></svg>`;
 const escape = value => String(value).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 const fresh = () => ({route:'home',space:'А',period:'А',zone:'А',sheet:false,review:'overview',periods:['А','Б'],selection:null,values:{},compact:false,emphasis:true,extra:true,admin:'А'});
 let state = fresh(), toastTimer, previousFocus;
 const main = $('#main'), dialog = $('#dialog'), menu = $('#section-menu');
 const selected = (a,b) => a === b ? ' selected' : '';
 const options = (prefix, current, list = ['А','Б','В']) => list.map(a => `<option value="${a}"${selected(a,current)}>${prefix} ${a}</option>`).join('');
 const head = (title, description = '', action = '') => `<div class="page-head"><div class="head-copy"><span class="eyebrow">Визуальная демонстрация</span><h1>${title}</h1><p>${description}</p></div>${action ? `<div class="button-row">${action}</div>` : ''}</div>`;
 const button = (title, action, cls = '', extra = '') => `<button class="${cls}" data-action="${action}" ${extra}>${title}</button>`;
 const lines = () => '<div class="placeholder-lines" aria-hidden="true"><i></i><i></i><i></i></div>';
 const note = () => '<p class="layout-note">Абстрактные заполнители · Без расчётов и рабочих документов</p>';
 const scopeToolbar = (search = false) => `<div class="toolbar"><label>Пространство <select data-change="space" aria-label="Пространство">${options('Пространство',state.space)}</select></label><label>Период <select data-change="period" aria-label="Период">${options('Период',state.period)}</select></label>${search ? '<input type="search" placeholder="Найти элемент…" aria-label="Найти элемент" data-search>' : ''}</div>`;
 function tabs(items, current, action = 'review-tab') {
  return `<div class="tabs" role="tablist">${items.map(([key,title])=>`<button role="tab" aria-selected="${key===current}" data-action="${action}" data-key="${key}">${title}</button>`).join('')}</div>`;
 }
 function showHome() {
  return head('Выберите раздел','Автономный макет для знакомства с визуальной структурой.') + '<p class="intro-note">Все обозначения условные. Можно открывать экраны, переключать вкладки и пробовать элементы интерфейса. Изменения исчезнут после перезагрузки.</p><div class="rule-label">Разделы интерфейса</div>' + `<div class="section-grid">${sections.map(([id,title,desc,type])=>`<button class="section-card" data-go="${id}"><span class="icon-tile">${icon(type)}</span><h2>${title}</h2><p>${desc}</p><span class="card-arrow" aria-hidden="true">→</span></button>`).join('')}</div>`;
 }
 function showObjects() {
  return head('Объекты','Условные пространства без адресов и реквизитов.') + `<div class="space-grid">${['А','Б','В'].map(letter=>`<article class="panel space-card"><span class="icon-tile">${icon('objects')}</span><h2>Пространство ${letter}</h2><p>Абстрактная карточка · Описание не заполнено</p>${button('Открыть','choose-space','secondary',`data-key="${letter}"`)}</article>`).join('')}</div>` + note();
 }
 function quantityTable(amount = 12) {
  return `<div class="table-scroll"><table class="quantity-table"><thead><tr><th>Элемент</th>${['А','Б','В'].map(a=>`<th>Зона ${a}</th>`).join('')}</tr></thead><tbody>${alphabet.slice(0,amount).map(letter=>`<tr data-row="элемент ${letter.toLowerCase()}"><td class="row-name">Элемент ${letter}</td>${['А','Б','В'].map(zone=>{const key=state.route+state.space+state.period+letter+zone;return `<td><input type="number" min="0" step="any" placeholder="—" aria-label="Элемент ${letter}, зона ${zone}" data-value="${key}" value="${escape(state.values[key]||'')}"></td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;
 }
 function showInventory() {
  const title = head('Инвентаризация',`Пространство ${state.space} · Условные периоды`,button(state.sheet?'К периодам':'Выбор вида','inventory-view','secondary') + button('Показать окно','tools'));
  if (!state.sheet) return title + scopeToolbar() + `<div class="space-grid">${['А','Б','В'].map(a=>`<button class="panel period-card" data-action="open-period" data-key="${a}"><strong>Период ${a}</strong><span class="pill">Макет</span><span aria-hidden="true">→</span></button>`).join('')}</div>` + note();
  return title + scopeToolbar(true) + `<div class="toolbar"><label>Зона <select data-change="zone" aria-label="Зона">${options('Зона',state.zone)}</select></label><div class="spacer"></div>${button('Поле ввода','keypad')}${button('Ручная строка','manual','secondary')}${button('Компактный вид','density')}</div><div class="inventory-layout"><div>${quantityTable(20)}</div><aside class="panel side-note"><h3>Рабочая область</h3><p>Пустые поля воспроизводят расположение элементов. Внесённые символы используются только в этой вкладке.</p>${lines()}<div class="button-row">${button('Инструменты','tools')}${button('Показать диалог','sample')}</div></aside></div>` + note();
 }
 function barPanel(title, teal = false) {
  return `<section class="panel ${teal?'teal':''}"><div class="panel-head"><h2>${title}</h2><span class="caption">Схема</span></div>${alphabet.slice(0,5).map(a=>`<div class="bar-row"><span>Элемент ${a}</span><div class="track"><div class="bar"></div></div><span>—</span></div>`).join('')}<p class="chart-caption">Иллюстрация компоновки · Полосы не представляют данные</p></section>`;
 }
 function chartPanel() {
  return `<section class="panel wide"><div class="panel-head"><h2>Визуальная схема</h2>${button('Изменить акцент','emphasis','text-button')}</div><svg class="chart-picture" viewBox="0 0 600 180" preserveAspectRatio="none" aria-label="Абстрактная схема без данных" role="img"><path class="grid" d="M0 30H600M0 80H600M0 130H600M50 0V180M180 0V180M310 0V180M440 0V180M570 0V180"/><path class="fill" d="M0 150 70 130 150 140 230 90 310 105 390 65 470 80 550 35 600 45V180H0Z"/><path class="shape" d="M0 150 70 130 150 140 230 90 310 105 390 65 470 80 550 35 600 45"/><path class="secondary-line" d="M0 165 70 145 150 150 230 135 310 145 390 110 470 120 550 90 600 100"/></svg><p class="chart-caption">Условные линии для демонстрации внешнего вида. Шкалы и расчёты отсутствуют.</p></section>`;
 }
 function comparison() {
  const periods=state.periods.length?state.periods:['А'];
  return `<div class="chip-row" role="group" aria-label="Периоды таблицы">${['А','Б','В'].map(a=>`<button aria-pressed="${state.periods.includes(a)}" data-action="toggle-period" data-key="${a}">Период ${a}</button>`).join('')}<div class="spacer"></div>${button('Столбцы','columns')}</div><div class="table-scroll"><table class="comparison"><thead><tr><th rowspan="2">Элемент</th>${periods.map(a=>`<th colspan="${state.extra?6:4}">Период ${a}</th>`).join('')}</tr><tr>${periods.map(()=>alphabet.slice(0,6).map((a,i)=>`<th class="${i===0?'period-edge ':''}${i>3?'extra-field':''}" ${i>3&&!state.extra?'hidden':''}>Поле ${a}</th>`).join('')).join('')}</tr></thead><tbody>${alphabet.slice(0,16).map(a=>`<tr data-row="элемент ${a.toLowerCase()}"><td>Элемент ${a}</td>${periods.map(()=>alphabet.slice(0,6).map((_,i)=>`<td class="numeric ${i===0?'period-edge ':''}${i>3?'extra-field':''}" ${i>3&&!state.extra?'hidden':''}>—</td>`).join('')).join('')}</tr>`).join('')}</tbody></table></div>`;
 }
 function showReview() {
  let result = head('Разбор инвентаризации','Пустые показатели и абстрактные схемы. Это демонстрация оформления.') + scopeToolbar(true) + tabs([['overview','Обзор'],['positions','Позиционный разбор'],['stock','Товарный запас']],state.review);
  if (state.review==='positions') return result + comparison() + note();
  if (state.review==='stock') return result + `<section class="panel"><div class="panel-head"><h2>Табличное представление</h2><span class="pill">Без расчётов</span></div>${plainTable(['Элемент','Поле А','Поле Б','Поле В','Поле Г'],10)}</section>` + note();
  return result + `<div class="metric-grid">${alphabet.slice(0,10).map(a=>`<article class="panel metric"><p>Показатель ${a}</p><strong>—</strong><small>Пустое значение</small></article>`).join('')}</div><div class="chart-grid">${barPanel('Блок А')}${barPanel('Блок Б',true)}${barPanel('Блок В')}${chartPanel()}${barPanel('Блок Г',true)}</div>` + note();
 }
 function plainTable(headers,count=6) {
  return `<div class="table-scroll"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${alphabet.slice(0,count).map(a=>`<tr data-row="элемент ${a.toLowerCase()}"><td class="row-name">Элемент ${a}</td>${headers.slice(1).map(()=>'<td class="numeric">—</td>').join('')}</tr>`).join('')}</tbody></table></div>`;
 }
 function showDocuments() {
  const title=sections.find(s=>s[0]===state.route)[1];
  const list=`<section class="panel list-panel"><div class="panel-head"><h2>Карточки</h2><span class="caption">Условные обозначения</span></div><div class="table-scroll"><table class="document-table"><thead><tr><th>Название</th><th>Период</th><th>Вид</th><th></th></tr></thead><tbody>${alphabet.slice(0,6).map(a=>`<tr data-row="карточка ${a.toLowerCase()}" class="${state.selection===a?'chosen':''}"><td>Карточка ${a}</td><td>Период А</td><td>Макет</td><td>${button('Открыть','open-card','',`data-key="${a}"`)}</td></tr>`).join('')}</tbody></table></div></section>`;
  const detail=state.selection?`<section class="panel detail-panel"><div class="panel-head"><h2>Карточка ${state.selection}</h2>${button('Закрыть','close-card','text-button')}</div><p class="muted caption">Только внешний вид формы · Не является документом</p><div class="detail-form"><label>Поле А<input placeholder="—" aria-label="Поле А"></label><label>Поле Б<select aria-label="Поле Б">${options('Вариант','А')}</select></label><label class="full">Текстовое поле<textarea placeholder="Пустое демонстрационное поле" aria-label="Текстовое поле"></textarea></label></div>${plainTable(['Элемент','Поле А','Поле Б'],5)}<div class="button-row">${button('Показать диалог','sample','primary')}${button('Изменить вид','density')}${button('Добавить строку','manual')}</div></section>`:'';
  return head(title,'Макет списка и рабочей области без реальных документов.',button('Новая карточка','new-card','primary')) + scopeToolbar(true) + tabs([['all','Все карточки'],['view','Вариант вида']], 'all', 'document-tab') + `<div class="split-workspace ${detail?'has-detail':'without-detail'}">${list}${detail}</div>` + note();
 }
 function showMaterials(contacts=false) {
  return head(contacts?'Контакты и обратная связь':'Регламенты',contacts?'Абстрактные карточки и пустая форма.':'Внешний вид материалов без содержимого документов.')+`<div class="content-grid">${['А','Б','В'].map(a=>`<article class="panel material-card"><span class="icon-tile">${icon(contacts?'contacts':'regulations')}</span><h2>${contacts?'Контакт':'Материал'} ${a}</h2><p>Условное представление</p>${lines()}${button(contacts?'Открыть форму':'Предпросмотр',contacts?'contact':'material','secondary')}</article>`).join('')}</div>`+note();
 }
 function showAdministration() {
  return head('Администрирование','Только компоновка панелей. Сотрудники, должности и правила доступа не моделируются.')+`<div class="admin-layout"><aside class="panel admin-menu">${['А','Б','В'].map(a=>`<button aria-pressed="${state.admin===a}" data-action="admin-tab" data-key="${a}">Панель ${a}</button>`).join('')}</aside><section class="panel"><div class="panel-head"><h2>Панель ${state.admin}</h2><span class="pill">Демо</span></div>${state.admin==='Б'?`<div class="settings-row"><label><input type="checkbox" data-change="compact" ${state.compact?'checked':''}>Компактный вид</label></div><div class="settings-row"><label><input type="checkbox" data-change="emphasis" ${state.emphasis?'checked':''}>Цветовые акценты</label></div>`:plainTable(['Элемент','Поле А','Поле Б'],6)}<div class="button-row">${button('Открыть окно','sample','secondary')}</div></section></div>`+note();
 }
 function render() {
  const route=state.route;
  let html;
  if(route==='home')html=showHome();
  else if(route==='objects')html=showObjects();
  else if(route==='inventory')html=showInventory();
  else if(route==='review')html=showReview();
  else if(['writeoffs','acts','results'].includes(route))html=showDocuments();
  else if(route==='regulations'||route==='contacts')html=showMaterials(route==='contacts');
  else if(route==='administration')html=showAdministration();
  else html=head('История изменений','Статичный макет без журнала действий и персональных сведений.')+plainTable(['Событие','Поле А','Поле Б','Поле В'],9)+note();
  main.innerHTML=html;main.classList.toggle('compact',state.compact);main.classList.toggle('emphasis-off',!state.emphasis);
  for(const b of menu.querySelectorAll('[data-go]')){if(b.dataset.go===route)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
 }
 function navigate(route) {
  if(route!=='home'&&!sections.some(s=>s[0]===route))route='home';
  if(route!==state.route)state.selection=null;
  state.route=route;closeMenu();render();main.focus({preventScroll:true});window.scrollTo(0,0);
 }
 function toast(text) { clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3000); }
 function closeMenu(focus=false) {menu.hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');if(focus)$('#menu-toggle').focus();}
 function openDialog(title,content) {if(!dialog.open)previousFocus=document.activeElement;$('#dialog-title').textContent=title;$('#dialog-body').innerHTML=content;if(!dialog.open)dialog.showModal();}
 const dialogNote='<p class="dialog-note">Это локальный макет. Действие не создаёт документов и не отправляет данные. Изменения исчезнут после перезагрузки.</p>';
 function perform(action,key) {
  if(action==='choose-space'){state.space=key;state.sheet=false;navigate('inventory');}
  else if(action==='open-period'){state.period=key;state.sheet=true;render();}
  else if(action==='inventory-view'){state.sheet=!state.sheet;render();}
  else if(action==='review-tab'){state.review=key;render();}
  else if(action==='admin-tab'){state.admin=key;render();}
  else if(action==='toggle-period'){if(state.periods.includes(key)){if(state.periods.length>1)state.periods=state.periods.filter(a=>a!==key);}else state.periods.push(key);render();}
  else if(action==='open-card'){state.selection=key;render();}
  else if(action==='close-card'){state.selection=null;render();}
  else if(action==='new-card'){state.selection='А';render();toast('Показан макет карточки');}
  else if(action==='document-tab'){document.querySelector('.document-table')?.classList.toggle('compact');toast('Изменён демонстрационный вид списка');}
  else if(action==='density'){state.compact=!state.compact;main.classList.toggle('compact',state.compact);}
  else if(action==='emphasis'){state.emphasis=!state.emphasis;main.classList.toggle('emphasis-off',!state.emphasis);}
  else if(action==='columns')openDialog('Видимость столбцов',dialogNote+`<label class="settings-row">Дополнительные поля<input type="checkbox" data-change="extra" ${state.extra?'checked':''}></label>`);
  else if(action==='tools')openDialog('Инструменты',dialogNote+'<div class="dialog-form">'+button('Изменить плотность','modal-density')+button('Показать поле ввода','keypad')+button('Открыть пустую форму','manual')+'</div>');
  else if(action==='keypad')openDialog('Поле ввода',dialogNote+'<label class="dialog-form">Условное значение<input id="keypad-value" type="text" inputmode="decimal" placeholder="—" readonly></label><div class="keypad">'+['1','2','3','4','5','6','7','8','9','Очистить','0','⌫'].map(a=>button(a,'key', '',`data-key="${a}"`)).join('')+'</div><div class="button-row">'+button('Готово','dismiss','primary')+'</div>');
  else if(action==='key'){const field=$('#keypad-value');if(field){if(key==='Очистить')field.value='';else if(key==='⌫')field.value=field.value.slice(0,-1);else if(field.value.length<10)field.value+=key;}}
  else if(action==='manual'||action==='contact')openDialog(action==='manual'?'Пустая строка':'Демонстрационная форма',dialogNote+'<form class="dialog-form"><label>Поле А<input placeholder="—" aria-label="Поле формы А"></label><label>Поле Б<textarea placeholder="—" aria-label="Поле формы Б"></textarea></label><div class="button-row">'+button('Применить','apply','primary')+'</div></form>');
  else if(action==='material')openDialog('Предпросмотр',dialogNote+'<div class="panel">'+lines()+lines()+lines()+'</div>');
  else if(action==='sample')openDialog('Демонстрационное окно',dialogNote+lines()+'<div class="button-row">'+button('Показать изменение','apply','primary')+button('Закрыть','dismiss')+'</div>');
  else if(action==='modal-density'){state.compact=!state.compact;main.classList.toggle('compact',state.compact);toast('Плотность макета изменена');}
  else if(action==='apply'){dialog.close();toast('Демонстрационное действие выполнено локально');}
  else if(action==='dismiss')dialog.close();
 }
 menu.innerHTML=sections.map(([id,title,,type])=>`<button role="menuitem" data-go="${id}">${icon(type)}<span>${title}</span></button>`).join('');
 $('#menu-toggle').addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;$('#menu-toggle').setAttribute('aria-expanded',String(open));if(open)menu.querySelector('button').focus();});
 document.addEventListener('click',event=>{const target=event.target.closest('button');if(!event.target.closest('.navigation'))closeMenu();if(target?.dataset.go)navigate(target.dataset.go);else if(target?.dataset.action)perform(target.dataset.action,target.dataset.key);});
 document.addEventListener('keydown',event=>{
  if(!menu.hidden){const buttons=[...menu.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);if(event.key==='Escape'){event.preventDefault();closeMenu(true);}else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length;buttons[next].focus();}else if(event.key==='Tab')closeMenu();}
 });
 document.addEventListener('input',event=>{const el=event.target;if(el.dataset.value)state.values[el.dataset.value]=el.value;if(el.matches('[data-search]')){const query=el.value.toLocaleLowerCase('ru-RU').trim();for(const row of main.querySelectorAll('[data-row]'))row.hidden=!row.dataset.row.includes(query);}});
 document.addEventListener('change',event=>{const el=event.target,key=el.dataset.change;if(['space','period','zone'].includes(key)&&['А','Б','В'].includes(el.value)){state[key]=el.value;render();}else if(key==='extra'){state.extra=el.checked;for(const cell of main.querySelectorAll('.extra-field'))cell.hidden=!state.extra;for(const h of main.querySelectorAll('.comparison thead tr:first-child th[colspan]'))h.colSpan=state.extra?6:4;}else if(key==='compact'||key==='emphasis'){state[key]=el.checked;main.classList.toggle(key==='compact'?'compact':'emphasis-off',key==='compact'?state.compact:!state.emphasis);}});
 document.addEventListener('submit',event=>event.preventDefault());
 $('#close-dialog').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{if(previousFocus?.isConnected)previousFocus.focus();});
 $('#reset-demo').addEventListener('click',()=>{if(dialog.open)dialog.close();state=fresh();navigate('home');toast('Макет сброшен');});
 navigate('home');
})();
