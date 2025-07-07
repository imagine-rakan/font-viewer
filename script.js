const fontUpload = document.getElementById('font-upload');
const preview = document.getElementById('preview');
const sampleText = document.getElementById('sample-text');
const fontSizeSlider = document.getElementById('font-size');
const fontSizeLabel = document.getElementById('font-size-label');
const featuresBox = document.getElementById('features');
const variationBox = document.getElementById('variation-controls');
const toggleThemeBtn = document.getElementById('toggle-theme');
const body = document.body;

const textColorPicker = document.getElementById('text-color');
const bgColorPicker = document.getElementById('bg-color');
const transparentBgCheckbox = document.getElementById('transparent-bg');

let font = null;
let fontName = '';
const axesMap = {};

// --- الوضع الليلي ---
function setTheme(dark) {
  if (dark) {
    body.classList.add('dark');
    toggleThemeBtn.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.remove('dark');
    toggleThemeBtn.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  }
}

toggleThemeBtn.addEventListener('click', () => {
  const isDark = body.classList.contains('dark');
  setTheme(!isDark);
});

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
  preview.textContent = sampleText.value;
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

function applyVariations() {
  if (!fontName) return;

  const vars = Object.entries(axesMap)
    .map(([tag, val]) => `"${tag}" ${val}`)
    .join(', ');
  preview.style.fontVariationSettings = vars;
}

const downloadBtn = document.getElementById('downloadPng');

downloadBtn.addEventListener('click', async () => {
  if (!font) {
    alert("يرجى رفع الخط أولاً");
    return;
  }

  await document.fonts.ready;

  const comp = getComputedStyle(preview);
  const textLines = preview.textContent.split('\n');
  const fontSize = comp.fontSize;
  const fontColor = textColorPicker.value || '#ffffff';
  const useTransparent = transparentBgCheckbox.checked;
  const bgColor = useTransparent ? 'none' : (bgColorPicker.value || '#000000');
  const fontFeatures = preview.style.fontFeatureSettings || 'normal';

  const svgWidth = 1200;
  const lineHeight = parseFloat(fontSize) * 1.6;
  const svgHeight = lineHeight * textLines.length + 100;

  const file = fontUpload.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const base64Font = e.target.result.split(',')[1];

    const totalTextHeight = lineHeight * textLines.length;
    const startY = (svgHeight - totalTextHeight) / 2 + lineHeight / 2;

    const textElements = textLines.map((line, i) => {
      const y = startY + i * lineHeight;
      const safeLine = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<text x="50%" y="${y}" text-anchor="middle" dominant-baseline="middle">${safeLine}</text>`;
    }).join('\n');

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
  <defs>
    <style type="text/css">
      @font-face {
        font-family: '${fontName}';
        src: url(data:font/ttf;base64,${base64Font}) format('truetype');
      }
      text {
        font-family: '${fontName}';
        font-size: ${fontSize};
        fill: ${fontColor};
        font-feature-settings: ${fontFeatures};
        white-space: pre;
      }
    </style>
  </defs>
  ${useTransparent ? '' : `<rect width="100%" height="100%" fill="${bgColor}" />`}
  ${textElements}
</svg>`;

    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth * 2;
      canvas.height = svgHeight * 2;
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.download = 'preview.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  };

  reader.readAsDataURL(file);
});
