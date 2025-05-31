// --- كود الوضع الليلي ---
const toggleThemeBtn = document.getElementById('toggle-theme');
const body = document.body;

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

// تفعيل الوضع المحفوظ مسبقًا
window.onload = () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme === 'dark');
  loadSettings(); // وظيفة موجودة مسبقًا لتحميل الإعدادات الأخرى
};

// --- باقي كود الخطوط والميزات والمتغيرات ... ---

// الكود السابق الموجود في السكريبت.js (خاص بالخطوط وفتح الخط والتحكم في الخصائص)
