"""Standalone demo checks. Requires an installed Playwright and Chromium.
Run npm run build, then npm start, then python3 tests/browser.py.
No screenshots and no external requests are made.
"""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parent.parent
url='http://127.0.0.1:4177'
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 external=[];errors=[];console_errors=[]
 def context(size):
  c=browser.new_context(viewport={'width':size[0],'height':size[1]},service_workers='block')
  def intercept(route):
   target=route.request.url
   if target.startswith(url+'/') or target.startswith('data:'):route.continue_()
   else:external.append(target);route.abort()
  c.route('**/*',intercept)
  return c
 def page(c):
  p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:console_errors.append(m.text) if m.type=='error' else None);return p
 def navigate(p,title):
  p.locator('#menu-toggle').click();p.locator('#section-menu').get_by_role('menuitem',name=title,exact=True).click();expect(p.locator('h1')).to_have_text(title)
 c=context((1366,900));p=page(c);p.goto(url);expect(p.locator('.section-card')).to_have_count(10)
 titles=['Инвентаризация','Списания','Акты проработок','Результаты','Разбор инвентаризации','Регламенты','Объекты','Контакты и обратная связь','История изменений','Администрирование']
 for title in titles:
  navigate(p,title);assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),title
 navigate(p,'Инвентаризация');p.get_by_role('button',name='Период А',exact=False).click();expect(p.locator('.quantity-table')).to_be_visible();field=p.get_by_label('Элемент А, зона А',exact=True);field.fill('2');p.get_by_label('Найти элемент',exact=True).fill('элемент б');expect(p.locator('.quantity-table tbody tr:visible')).to_have_count(1);p.get_by_label('Найти элемент',exact=True).fill('')
 p.get_by_role('button',name='Поле ввода',exact=True).click();expect(p.locator('#dialog')).to_be_visible();p.locator('#dialog').get_by_role('button',name='2',exact=True).click();expect(p.locator('#keypad-value')).to_have_value('2');p.keyboard.press('Escape');expect(p.locator('#dialog')).not_to_be_visible();expect(p.get_by_role('button',name='Поле ввода',exact=True)).to_be_focused()
 navigate(p,'Разбор инвентаризации');expect(p.locator('.metric')).to_have_count(10);assert all(t=='—' for t in p.locator('.metric strong').all_text_contents());p.get_by_role('tab',name='Позиционный разбор',exact=True).click();expect(p.locator('.comparison thead tr').first).to_contain_text('Период АПериод Б');p.get_by_role('button',name='Период В',exact=True).click();expect(p.locator('.comparison thead tr').first).to_contain_text('Период В');p.get_by_role('button',name='Столбцы',exact=True).click();p.locator('#dialog input[type=checkbox]').uncheck();assert p.locator('.comparison .extra-field:visible').count()==0;p.keyboard.press('Escape');p.get_by_role('tab',name='Товарный запас',exact=True).click()
 for title in ['Списания','Акты проработок','Результаты']:
  navigate(p,title);p.locator('.document-table').get_by_role('button',name='Открыть',exact=True).first.click();expect(p.locator('.detail-panel')).to_be_visible();p.get_by_role('button',name='Показать диалог',exact=True).click();expect(p.locator('#dialog')).to_be_visible();p.keyboard.press('Escape');p.get_by_role('button',name='Закрыть',exact=True).click()
 navigate(p,'Контакты и обратная связь');p.get_by_role('button',name='Открыть форму',exact=True).first.click();p.get_by_label('Поле формы А',exact=True).fill('Условный текст');p.get_by_role('button',name='Применить',exact=True).click();expect(p.locator('#dialog')).not_to_be_visible()
 navigate(p,'Администрирование');p.get_by_role('button',name='Панель Б',exact=True).click();p.get_by_label('Компактный вид',exact=True).check();expect(p.locator('#main')).to_have_class('compact')
 p.reload();navigate(p,'Инвентаризация');p.get_by_role('button',name='Период А',exact=False).click();expect(p.get_by_label('Элемент А, зона А',exact=True)).to_have_value('');assert p.evaluate('localStorage.length===0 && sessionStorage.length===0')
 for size in [(390,844),(768,1024),(1024,768),(1920,1080)]:
  p.set_viewport_size({'width':size[0],'height':size[1]})
  p.get_by_role('button',name='На главную',exact=True).click();expect(p.locator('.section-card')).to_have_count(10);assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  navigate(p,'Списания');p.locator('.document-table').get_by_role('button',name='Открыть',exact=True).first.click();expect(p.locator('.detail-panel')).to_be_visible();assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  p.get_by_role('button',name='Показать диалог',exact=True).click();expect(p.locator('#dialog')).to_be_visible();p.keyboard.press('Escape');p.get_by_role('button',name='Закрыть',exact=True).click()
 # Exercise the entire self-contained HTML with network disabled.
 # Direct file navigation can be restricted by a managed browser policy.
 standalone=context((390,844));standalone.set_offline(True);f=page(standalone);f.set_content((root/'index.html').read_text());expect(f.locator('.section-card')).to_have_count(10);navigate(f,'Инвентаризация');f.get_by_role('button',name='Период А',exact=False).click();expect(f.locator('.quantity-table')).to_be_visible();f.get_by_role('button',name='Поле ввода',exact=True).click();expect(f.locator('#dialog')).to_be_visible()
 assert not external,'Unexpected external requests';assert not errors,errors;assert not console_errors,console_errors
 print('PASS browser: ten screens, navigation, tables, search, modal/keypad, analytics tabs, column visibility, local forms, state reset, phone/tablet/desktop widths, offline self-contained HTML; external requests=0; JavaScript/CSP errors=0.')
 standalone.close();c.close();browser.close()
