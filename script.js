
const fontUpload = document.getElementById('font-upload');
const preview = document.getElementById('preview');
const sampleText = document.getElementById('sample-text');
const fontSizeSlider = document.getElementById('font-size');
const fontSizeLabel = document.getElementById('font-size-label');
const featuresBox = document.getElementById('features');
const variationBox = document.getElementById('variation-controls');

let font = null;
let fontName = '';
const axesMap = {};

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
});

sampleText.addEventListener('input', () => {
  preview.textContent = sampleText.value;
  saveSettings();
});

fontSizeSlider.addEventListener('input', () => {
  const size = fontSizeSlider.value;
  fontSizeLabel.textContent = size;
  preview.style.fontSize = size + 'px';
  saveSettings();
});

function loadFeatures() {
  featuresBox.innerHTML = '';
  const seen = new Set();
  if (font && font.tables && font.tables.gsub && font.tables.gsub.features) {
    font.tables.gsub.features.forEach(f => {
      if (!seen.has(f.tag)) {
        seen.add(f.tag);
        const label = document.createElement('label');
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
  loadSettings();
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
    title.textContent = '🎚️ محاور الخط المتغير';
    variationBox.appendChild(title);
    font.tables.fvar.axes.forEach(axis => {
      const { tag, minValue, maxValue, defaultValue } = axis;
      const wrapper = document.createElement('div');
      const label = document.createElement('label');
      label.innerHTML = `${tag}: <span id="val-${tag}">${defaultValue}</span>`;
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = minValue;
      slider.max = maxValue;
      slider.step = 1;
      slider.value = defaultValue;
      slider.id = `axis-${tag}`;
      slider.dataset.tag = tag;
      slider.addEventListener('input', () => {
        document.getElementById(`val-${tag}`).textContent = slider.value;
        applyVariations();
        saveSettings();
      });
      axesMap[tag] = slider.value;
      wrapper.appendChild(label);
      wrapper.appendChild(slider);
      variationBox.appendChild(wrapper);
    });
    applyVariations();
  }
}

function applyVariations() {
  const variations = Object.keys(axesMap).map(tag => {
    const slider = document.getElementById(`axis-${tag}`);
    if (slider) return `"${tag}" ${slider.value}`;
    return '';
  });
  preview.style.fontVariationSettings = variations.join(', ');
}

function saveSettings() {
  const features = Array.from(document.querySelectorAll('.feature-checkbox:checked'))
    .map(cb => cb.dataset.tag);
  const variations = {};
  Object.keys(axesMap).forEach(tag => {
    const val = document.getElementById(`axis-${tag}`)?.value;
    if (val) variations[tag] = val;
  });
  localStorage.setItem('text', sampleText.value);
  localStorage.setItem('fontSize', fontSizeSlider.value);
  localStorage.setItem('features', JSON.stringify(features));
  localStorage.setItem('variations', JSON.stringify(variations));
}

function loadSettings() {
  const savedText = localStorage.getItem('text') || '';
  const savedSize = localStorage.getItem('fontSize') || '40';
  const savedFeatures = JSON.parse(localStorage.getItem('features') || '[]');
  const savedVariations = JSON.parse(localStorage.getItem('variations') || '{}');

  sampleText.value = savedText;
  preview.textContent = savedText;
  fontSizeSlider.value = savedSize;
  fontSizeLabel.textContent = savedSize;
  preview.style.fontSize = savedSize + 'px';

  document.querySelectorAll('.feature-checkbox').forEach(cb => {
    if (savedFeatures.includes(cb.dataset.tag)) {
      cb.checked = true;
    }
  });

  setTimeout(() => {
    Object.entries(savedVariations).forEach(([tag, val]) => {
      const slider = document.getElementById(`axis-${tag}`);
      if (slider) {
        slider.value = val;
        document.getElementById(`val-${tag}`).textContent = val;
      }
    });
    applyVariations();
    applyFeatures();
  }, 500);
}

window.onload = loadSettings;
