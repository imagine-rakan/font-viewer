const downloadBtn = document.getElementById('downloadPng');

downloadBtn.addEventListener('click', () => {
  const text = preview.textContent;
  const comp = window.getComputedStyle(preview);
  const font = `${comp.fontStyle} ${comp.fontWeight} ${comp.fontSize} ${comp.fontFamily}`;
  const color = comp.color;
  const bg = comp.backgroundColor || '#ffffff';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const padding = 20;

  ctx.font = font;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = parseInt(comp.fontSize);

  canvas.width = textWidth + padding * 2;
  canvas.height = textHeight + padding * 2;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textBaseline = 'top';
  ctx.fillText(text, padding, padding);

  // إنشاء رابط تحميل الصورة
  const link = document.createElement('a');
  link.download = 'preview.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
