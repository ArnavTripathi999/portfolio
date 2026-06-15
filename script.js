/* =============================================
   MODULE 1: Custom Cursor
   ============================================= */
(function initCursor() {
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;

  if (!dot || !ring) return;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover effect on clickable elements
  const hoverTargets = 'a, button, input, textarea, .ctrl-btn, .submit-btn, .social-link, .grid-item, .hero-cta';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) {
      ring.classList.add('hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) {
      ring.classList.remove('hover');
    }
  });

  // Hide ring when leaving window
  document.addEventListener('mouseleave', () => ring.classList.add('hidden'));
  document.addEventListener('mouseenter', () => ring.classList.remove('hidden'));
})();

/* =============================================
   MODULE 2: Navigation & Active Section
   ============================================= */
(function initNavigation() {
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section');

  // Intersection Observer for active nav link
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        links.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('data-section') === id);
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach((section) => observer.observe(section));

  // Smooth scroll on nav click (prevent default anchor jump)
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();

/* =============================================
   MODULE 3: Three.js Hero Background
   - Full-screen particle constellation behind hero text
   - Cursor movement mapped to camera rotation
   ============================================= */
(function initHeroScene() {
  const container = document.getElementById('hero-canvas');
  if (!container) return;

  // Verify Three.js loaded
  if (typeof THREE === 'undefined') {
    console.warn('[Hero 3D] Three.js not loaded — skipping scene');
    return;
  }

  // Setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 0, 14);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Create particle constellation
  const particleCount = 2500;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const spread = 16;

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = spread * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    const tint = Math.random();
    colors[i3] = 0.7 + 0.3 * tint;
    colors[i3 + 1] = 0.8 + 0.2 * tint;
    colors[i3 + 2] = 1.0;
  }

  const originalColors = new Float32Array(colors);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const colorAttr = new THREE.BufferAttribute(colors, 3);
  geometry.setAttribute('color', colorAttr);

  const material = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    depthWrite: false,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Add some connecting lines (subtle constellation effect)
  const linePositions = [];
  const lineCount = 120;

  for (let i = 0; i < lineCount; i++) {
    const idx1 = Math.floor(Math.random() * particleCount);
    const idx2 = Math.floor(Math.random() * particleCount);
    const i1 = idx1 * 3;
    const i2 = idx2 * 3;

    // Only connect nearby particles
    const dx = positions[i1] - positions[i2];
    const dy = positions[i1 + 1] - positions[i2 + 1];
    const dz = positions[i1 + 2] - positions[i2 + 2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist < 4) {
      linePositions.push(positions[i1], positions[i1 + 1], positions[i1 + 2]);
      linePositions.push(positions[i2], positions[i2 + 1], positions[i2 + 2]);
    }
  }

  let lineMat = null;
  if (linePositions.length > 0) {
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    lineMat = new THREE.LineBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.06,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);
  }

  console.log('[Hero 3D] Scene initialized — ' + particleCount + ' particles');

  // Mouse tracking for camera
  let mouseNormX = 0;
  let mouseNormY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseNormX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNormY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // Touch support for mobile
  document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    if (touch) {
      mouseNormX = (touch.clientX / window.innerWidth) * 2 - 1;
      mouseNormY = -(touch.clientY / window.innerHeight) * 2 + 1;
    }
  }, { passive: true });

  // Animation loop
  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.002;

    // Subtle particle rotation
    particles.rotation.x += 0.0001;
    particles.rotation.y += 0.0003;

    // Camera follows mouse with smooth interpolation
    camera.position.x += (mouseNormX * 1.5 - camera.position.x) * 0.02;
    camera.position.y += (mouseNormY * 1.0 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();

  // Handle resize for hero canvas
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', onResize);

  // Theme-aware particle colors: dim when light theme is active
  function setParticleTheme(isLight) {
    const arr = colorAttr.array;
    if (isLight) {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = originalColors[i] * 0.08;
      }
      material.opacity = 0.15;
      if (lineMat) { lineMat.opacity = 0; }
    } else {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = originalColors[i];
      }
      material.opacity = 0.7;
      if (lineMat) { lineMat.opacity = 0.08; }
    }
    colorAttr.needsUpdate = true;
  }

  // Apply initial theme (in case localStorage already had light)
  if (document.documentElement.getAttribute('data-theme') === 'light') {
    setParticleTheme(true);
  }

  // Expose for theme toggle module
  window.__heroTheme = setParticleTheme;

  // Store reference for cleanup if needed
  window.__heroResize = onResize;
})();

/* =============================================
   MODULE 4: Gallery Section 2 - State Toggle
   - Clicking "Modify Section State" changes the
     ambient appearance of Section 2 only
   ============================================= */
(function initSectionToggle() {
  const toggleBtn = document.getElementById('toggleState');
  const stateValue = document.getElementById('stateValue');
  const block = document.getElementById('interactive-block');
  const slider = document.getElementById('ambient-slider');
  const sliderValue = document.getElementById('sliderValue');
  const eventLog = document.getElementById('eventLog');

  if (!toggleBtn) return;

  let isActive = true;

  function pushLog(msg, cls) {
    if (!eventLog) return;
    const now = new Date();
    const t = now.toTimeString().slice(0, 8);
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = '<span class="log-time">[' + t + ']</span> <span class="log-msg ' + cls + '">' + msg + '</span>';
    eventLog.appendChild(entry);
    eventLog.scrollTop = eventLog.scrollHeight;
    // Keep max 20 entries
    while (eventLog.children.length > 20) eventLog.removeChild(eventLog.firstChild);
  }

  toggleBtn.addEventListener('click', () => {
    isActive = !isActive;

    if (isActive) {
      stateValue.textContent = 'ACTIVE';
      stateValue.style.color = '';
      block.classList.remove('altered');
      pushLog('Array State: ENABLED  —  mode NORMAL', 'event-normal');
    } else {
      stateValue.textContent = 'MODIFIED';
      stateValue.style.color = '#ff6b6b';
      block.classList.add('altered');
      pushLog('Array State: DISABLED  —  mode ALTERED', 'event-altered');
    }
  });

  // Slider controls section opacity/intensity
  if (slider && sliderValue) {
    slider.addEventListener('input', () => {
      const val = slider.value;
      sliderValue.textContent = val + '%';
      block.style.opacity = 0.5 + (val / 100) * 0.5;
    });
  }
})();

/* =============================================
   MODULE 5: Live Clock & Event Log
   - Digital clock with ms precision
   - Log entries from toggle actions
   ============================================= */
(function initLiveClock() {
  const timeEl = document.getElementById('clockTime');
  const msEl = document.getElementById('clockMs');
  const dateEl = document.getElementById('clockDate');

  if (!timeEl) return;

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now = new Date();
    timeEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    if (msEl) msEl.textContent = '.' + String(now.getMilliseconds()).padStart(3, '0');
    if (dateEl) {
      const opts = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-US', opts);
    }
    requestAnimationFrame(tick);
  }
  tick();
})();

/* =============================================
   MODULE 6: Gallery Section 3 - Local 3D Scene
   - Floating abstract shapes inside the grid item
   - Shapes track mouse cursor when over Section 3
   ============================================= */
(function initLocalScene() {
  const container = document.getElementById('local-3d-canvas');
  const section3 = document.getElementById('reactive-3d-block');
  const trackX = document.getElementById('trackX');
  const trackY = document.getElementById('trackY');
  const sceneIndicator = document.getElementById('sceneIndicator');
  const sceneStatus = document.getElementById('sceneStatus');

  if (!container || !section3) return;

  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404060);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(2, 3, 4);
  scene.add(dirLight);

  const dirLight2 = new THREE.DirectionalLight(0x00f2fe, 0.4);
  dirLight2.position.set(-2, -1, 3);
  scene.add(dirLight2);

  // Create floating shapes
  const shapes = [];
  const shapeData = [
    { geo: new THREE.IcosahedronGeometry(0.6, 0), color: 0x00f2fe, pos: [-1.2, 0.2, 0] },
    { geo: new THREE.OctahedronGeometry(0.55, 0), color: 0x00ff87, pos: [1.2, -0.3, 0] },
    { geo: new THREE.TorusKnotGeometry(0.4, 0.15, 64, 8), color: 0xff6b6b, pos: [0, 0.8, -0.5] },
    { geo: new THREE.DodecahedronGeometry(0.5, 0), color: 0xffd93d, pos: [0, -0.7, 0.5] },
  ];

  shapeData.forEach((data) => {
    const mat = new THREE.MeshStandardMaterial({
      color: data.color,
      metalness: 0.3,
      roughness: 0.4,
      emissive: data.color,
      emissiveIntensity: 0.05,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(data.geo, mat);
    mesh.position.set(data.pos[0], data.pos[1], data.pos[2]);
    scene.add(mesh);
    shapes.push(mesh);
  });

  // Mouse tracking relative to section 3
  let mouseNormInBlock = { x: 0, y: 0 };
  let isOverSection = false;

  section3.addEventListener('mouseenter', () => { isOverSection = true; });
  section3.addEventListener('mouseleave', () => {
    isOverSection = false;
    mouseNormInBlock = { x: 0, y: 0 };
  });

  section3.addEventListener('mousemove', (e) => {
    const rect = section3.getBoundingClientRect();
    mouseNormInBlock.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseNormInBlock.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (trackX) trackX.textContent = mouseNormInBlock.x.toFixed(2);
    if (trackY) trackY.textContent = mouseNormInBlock.y.toFixed(2);
  });

  // IntersectionObserver to pause when off-screen
  let isVisible = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isVisible = entry.isIntersecting;
      if (sceneIndicator) {
        sceneIndicator.classList.toggle('inactive', !isVisible);
      }
      if (sceneStatus) {
        sceneStatus.textContent = isVisible ? 'Scene Active' : 'Scene Paused';
      }
    });
  }, { threshold: 0.1 });

  observer.observe(section3);

  // Animation loop
  let localTime = 0;

  function animate() {
    requestAnimationFrame(animate);
    localTime += 0.008;

    if (!isVisible) {
      renderer.render(scene, camera);
      return;
    }

    const targetRotY = mouseNormInBlock.x * 0.8;
    const targetRotX = mouseNormInBlock.y * 0.5;

    shapes.forEach((mesh, i) => {
      // Individual float animation
      mesh.position.y += Math.sin(localTime * 0.8 + i * 2) * 0.001;
      mesh.rotation.x += 0.005 * (i % 2 === 0 ? 1 : -1);
      mesh.rotation.y += 0.008 * (i % 3 === 0 ? 1 : -1);
      mesh.rotation.z += 0.003 * (i % 2 === 0 ? 1 : -1);

      // Track mouse: rotate toward cursor position
      if (isOverSection) {
        mesh.rotation.x += (targetRotX * 0.3 - mesh.rotation.x * 0.02) * 0.05;
        mesh.rotation.y += (targetRotY * 0.3 - mesh.rotation.y * 0.02) * 0.05;
      }
    });

    // Subtle camera sway
    if (isOverSection) {
      camera.position.x += (mouseNormInBlock.x * 0.3 - camera.position.x) * 0.02;
      camera.position.y += (mouseNormInBlock.y * 0.2 - camera.position.y) * 0.02;
    }
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();

  // Resize handler for local canvas
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  }

  window.addEventListener('resize', onResize);
  window.__localSceneResize = onResize;
})();

/* =============================================
   MODULE 6: Discord Copy / Social Links
   - Copies Discord ID and email to clipboard with toast
   ============================================= */
(function initSocialLinks() {
  const discordBtn = document.getElementById('discordLink');
  const emailLink = document.getElementById('emailLink');
  const toast = document.getElementById('toast');
  if (!toast) return;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function copyToClipboard(text, msg) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(msg);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(msg);
    });
  }

  if (discordBtn) {
    discordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      copyToClipboard('ballers_999', 'Discord ID copied!');
    });
  }

  if (emailLink) {
    emailLink.addEventListener('click', (e) => {
      e.preventDefault();
      copyToClipboard('arnavcoderingzb@gmail.com', 'Gmail id copied');
    });
  }
})();

/* =============================================
   MODULE 8: Contact Form Handler
   - Validates inputs, simulates submission
   - Shows success micro-interaction
   ============================================= */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  if (!form || !submitBtn) return;

  const inputs = {
    name: document.getElementById('formName'),
    email: document.getElementById('formEmail'),
    message: document.getElementById('formMessage'),
  };

  // Floating label fix: set placeholder so :not(:placeholder-shown) works
  Object.values(inputs).forEach((input) => {
    input.setAttribute('placeholder', ' ');
  });

  function validate(input) {
    if (input.id === 'formEmail') {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
      const showErr = input.value.length > 0 && !isValid;
      input.classList.toggle('error', showErr || input.value.length === 0);
      if (input.value.length === 0) input.classList.add('error');
      return isValid && input.value.length > 0;
    }
    const isValid = input.value.trim().length > 0;
    input.classList.toggle('error', !isValid);
    return isValid;
  }

  Object.values(inputs).forEach((input) => {
    input.addEventListener('blur', () => validate(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) validate(input);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let valid = true;
    Object.values(inputs).forEach((input) => {
      if (!validate(input)) valid = false;
    });

    if (!valid) return;

    const btnText = submitBtn.querySelector('.btn-text');
    submitBtn.disabled = true;
    btnText.textContent = 'Sending...';
    submitBtn.style.opacity = '0.6';

    emailjs.init('ZtabLpOOP5T2KKIt5');

    const templateParams = {
      from_name: inputs.name.value,
      from_email: inputs.email.value,
      message: inputs.message.value,
    };

    emailjs.send('service_nbx90rk', 'template_sw6au9p', templateParams)
    .then(() => {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
      submitBtn.classList.add('sent');
      btnText.textContent = 'Send Message';
      Object.values(inputs).forEach((input) => { input.value = ''; });
      setTimeout(() => { submitBtn.classList.remove('sent'); }, 3000);
    })
    .catch(() => {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
      btnText.textContent = 'Send Message';
      alert('Failed to send. Please try again or email me directly.');
    });
  });
})();

/* =============================================
   MODULE 9: Theme Toggle (Moon/Sun)
   - Toggles light/dark theme via data-theme attribute
   - Persists preference in localStorage
   ============================================= */
(function initThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  const stored = localStorage.getItem('theme');
  if (stored === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  toggle.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
      if (window.__heroTheme) window.__heroTheme(false);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      if (window.__heroTheme) window.__heroTheme(true);
    }
  });
})();

/* =============================================
   MODULE 10: Window Resize Coordination
   - Ensures both Three.js scenes resize properly
   ============================================= */
(function initGlobalResize() {
  let resizeTimeout;

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (window.__heroResize) window.__heroResize();
      if (window.__localSceneResize) window.__localSceneResize();
    }, 150);
  });
})();
