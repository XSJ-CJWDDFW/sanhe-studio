(() => {
  'use strict';
  const form = document.getElementById('co-brief');
  const modes = [...document.querySelectorAll('[name="co-mode"]')];
  const selected = document.getElementById('co-selected-mode');
  const preview = document.getElementById('co-brief-preview');
  const details = document.getElementById('co-preview');
  const status = document.getElementById('co-status');
  const benefit = document.getElementById('co-benefit');
  const labels = ['合作立减200！','免费直播课程纸质版一套！','免费加剪一条片子！','免费加两条文案！','免费梳理品牌逻辑！','随机赠送skills！','免费加拍5个镜头！'];
  let prize = null;
  function text() {
    const values = new FormData(form);
    const services = values.getAll('service');
    const lines = ['叁合 SANHE · 合作需求','',`合作方式：${modes.find(input=>input.checked)?.value || '待沟通'}`,`需要支持：${services.length ? services.join('、') : '一起沟通确定'}`,`项目情况：${String(values.get('description') || '').trim() || '待补充'}`,`期望时间：${String(values.get('timeline') || '').trim() || '可沟通'}`,`预算范围：${String(values.get('budget') || '').trim() || '可沟通'}`];
    if (prize) lines.push('',`我的合作福利：${labels[prize.index]}`);
    return lines.join('\n');
  }
  function update() {
    selected.textContent = modes.find(input=>input.checked)?.value || '单项制作';
    preview.value = text();
  }
  function validate() {
    const description = form.elements.namedItem('description');
    description.setCustomValidity(description.value.trim() ? '' : '请简单说说你希望完成的事情。');
    return form.reportValidity();
  }
  function edited() {
    update();status.textContent='先整理成文字，复制后发给你的对接人。';status.classList.remove('is-success');
  }
  modes.forEach(input=>input.addEventListener('change',edited));
  form.addEventListener('input',() => {form.elements.namedItem('description').setCustomValidity('');edited();});
  function setPrize(value) {
    if (!value || !Number.isInteger(value.index) || value.index < 0 || value.index >= labels.length) return;
    prize = {index:value.index};
    document.getElementById('co-benefit-label').textContent = labels[prize.index];
    benefit.hidden = false;
    update();
  }
  // Read only. Opening the cooperation section never creates or changes a draw.
  function readPrize() {
    if (!('indexedDB' in window)) return;
    const request = indexedDB.open('sanhe-laosan-v1',1);
    request.onupgradeneeded = () => {if (!request.result.objectStoreNames.contains('state')) request.result.createObjectStore('state');};
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('state','readonly');
      const record = tx.objectStore('state').get('main');
      record.onsuccess = () => setPrize(record.result?.reward);
      tx.oncomplete = () => db.close();
    };
  }
  document.addEventListener('sanhe-reward-selected',event=>setPrize(event.detail));
  if ('BroadcastChannel' in window) new BroadcastChannel('sanhe-laosan-v1').addEventListener('message',readPrize);
  document.addEventListener('visibilitychange',() => {if (!document.hidden) readPrize();});
  form.addEventListener('submit',async event => {
    event.preventDefault();
    if (!validate()) return;
    update();
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(preview.value);
      status.textContent = '需求已复制，可以发给对接人了。';status.classList.add('is-success');
    } catch {
      details.open = true;preview.focus();preview.select();
      status.textContent = '需求已整理，请复制下方文字，或保存为文本。';
      status.classList.remove('is-success');
    } finally {button.disabled = false;}
  });
  document.getElementById('co-download').addEventListener('click',() => {
    if (!validate()) return;
    update();
    const url = URL.createObjectURL(new Blob(['\ufeff',preview.value],{type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;link.download = '叁合SANHE-合作需求.txt';
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent = '需求便签已生成，请查看浏览器下载。';status.classList.add('is-success');
  });
  readPrize();update();
})();
