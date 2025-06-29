const fontUpload = document.getElementById('font-upload');
const preview = document.getElementById('preview');
const sampleText = document.getElementById('sample-text');
const fontSizeSlider = document.getElementById('font-size');
const fontSizeLabel = document.getElementById('font-size-label');
const featuresBox = document.getElementById('features');
const variationBox = document.getElementById('variation-controls');
const toggleThemeBtn = document.getElementById('toggle-theme');
const body = document.body;

let font = null;
let fontName = '';
const axesMap = {};

// --- الوضع الليلي ---
function setTheme(dark) {
  if (dark) {
    body.classList.add('dark');
    toggleThemeBtn.textContent = '☀️'; // أيقونة شمس
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.remove('dark');
    toggleThemeBtn.textContent = '🌙'; // أيقونة قمر
    localStorage.setItem('theme', 'light');
  }
}

toggleThemeBtn.addEventListener('click', () => {
  const isDark = body.classList.contains('dark');
  setTheme(!isDark);
});

// تهيئة عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme === 'dark');
});

fontUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const arrayBuffer = await file.arrayBuffer();
  font = opentype.parse(arrayBuffer);
  fontName = 'uploaded-font';
  const fontFace = new FontFace(fontName, arrayBuffer);
  await fontFace.load();
  document.fonts.add(fontFace);
  preview.style.fontFamily = fontName;
  loadFeatures();
  loadVariations();
  preview.textContent = sampleText.value; // لتحديث النص بعد تحميل الخط
});

sampleText.addEventListener('input', () => {
  preview.textContent = sampleText.value;
});

fontSizeSlider.addEventListener('input', () => {
  const size = fontSizeSlider.value;
  fontSizeLabel.textContent = size;
  preview.style.fontSize = size + 'px';
});

function loadFeatures() {
  featuresBox.innerHTML = '';
  const seen = new Set();
  if (font && font.tables && font.tables.gsub && font.tables.gsub.features) {
    font.tables.gsub.features.forEach(f => {
      if (!seen.has(f.tag)) {
        seen.add(f.tag);
        const label = document.createElement('label');
        label.style.marginRight = '10px';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.tag = f.tag;
        checkbox.className = 'feature-checkbox';
        checkbox.addEventListener('change', applyFeatures);
        label.appendChild(checkbox);
        label.append(' ' + f.tag);
        featuresBox.appendChild(label);
      }
    });
  }
  applyFeatures();
}

function applyFeatures() {
  const features = Array.from(document.querySelectorAll('.feature-checkbox:checked'))
    .map(cb => `"${cb.dataset.tag}" 1`);
  preview.style.fontFeatureSettings = features.join(', ');
}

function loadVariations() {
  variationBox.innerHTML = '';
  if (font && font.tables.fvar && font.tables.fvar.axes) {
    const title = document.createElement('h3');
    title.textContent = '⚙️ تحكم في الخط المتغير';
    variationBox.appendChild(title);

    font.tables.fvar.axes.forEach(axis => {
      axesMap[axis.tag] = axis.defaultValue;

      const wrapper = document.createElement('div');
      wrapper.style.marginBottom = '12px';

      const label = document.createElement('label');
      label.textContent = `${axis.name.en} (${axis.tag}): `;
      label.htmlFor = 'axis-' + axis.tag;

      const input = document.createElement('input');
      input.type = 'range';
      input.id = 'axis-' + axis.tag;
      input.min = axis.minValue;
      input.max = axis.maxValue;
      input.value = axis.defaultValue;
      input.step = 0.01;
      input.style.width = '200px';

      const valSpan = document.createElement('span');
      valSpan.textContent = axis.defaultValue.toFixed(2);
      valSpan.style.marginLeft = '8px';

      input.addEventListener('input', () => {
        axesMap[axis.tag] = parseFloat(input.value);
        valSpan.textContent = input.value;
        applyVariations();
      });

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      wrapper.appendChild(valSpan);
      variationBox.appendChild(wrapper);
    });

    applyVariations();
  }
}

const downloadBtn = document.getElementById('downloadPng');

downloadBtn.addEventListener('click', async () => {
  if (!fontName) {
    alert('يرجى تحميل الخط أولاً');
    return;
  }

  await document.fonts.ready;

  const comp = window.getComputedStyle(preview);
  const font = `${comp.fontStyle} ${comp.fontWeight} ${comp.fontSize} ${comp.fontFamily}`;
  const color = comp.color;
  const bg = comp.backgroundColor || '#ffffff';

  // نص المعاينة (يدعم الأسطر المتعددة)
  const text = preview.textContent;
  const lines = text.split('\n');

  const padding = 20;
  const scale = 2; // التكبير لتحسين الجودة

  // أنشئ canvas مؤقت لحساب حجم النص
  const tmpCanvas = document.createElement('canvas');
  const tmpCtx = tmpCanvas.getContext('2d');
  tmpCtx.font = font;

  // حساب العرض الأعظم للطول (العرض)
  let maxWidth = 0;
  lines.forEach(line => {
    const metrics = tmpCtx.measureText(line);
    if (metrics.width > maxWidth) maxWidth = metrics.width;
  });

  // ارتفاع السطر (يمكن تحسينه، هكذا تقريباً)
  const fontSizePx = parseInt(comp.fontSize);
  const lineHeight = fontSizePx * 1.2;

  // إعداد أبعاد الـ canvas مضاعفة للتحسين
  const canvasWidth = (maxWidth + padding * 2) * scale;
  const canvasHeight = (lineHeight * lines.length + padding * 2) * scale;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale); // نضبط مقياس الرسم للتكبير

  // الخلفية
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvasWidth / scale, canvasHeight / scale);

  // إعدادات النص
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textBaseline = 'top';

  // رسم كل سطر مع التباعد
  lines.forEach((line, i) => {
    ctx.fillText(line, padding, padding + i * lineHeight);
  });

  // تحميل الصورة
  const link = document.createElement('a');
  link.download = 'preview.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

