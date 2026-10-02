/**
 * Punit Ranjan (@punitr2007) - Interactive Showcase Logic
 * Features: Typewriter, Terminal Emulator, Live Filtering, GitHub API sync, Modals, Toasts
 */

document.addEventListener('DOMContentLoaded', () => {
  initTypewriter();
  initLiveClock();
  initHeaderScroll();
  initSkillsFilter();
  initProjectControls();
  initTerminalEmulator();
  initProjectModals();
  initClipboardActions();
  initGithubStats();
});

/* --------------------------------------------------------------------------
   1. Typewriter Effect
   -------------------------------------------------------------------------- */
const typewriterPhrases = [
  "Systems & Multimedia Software Engineer",
  "Tauri v2 + Rust + Modern C++ Developer",
  "Real-Time AI Video Interpolation (mpv/Vulkan)",
  "Hardware EDA & Digital Circuit Tooling",
  "Building High-Performance Desktop & Web Apps"
];

function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typeSpeed = 50;
  const deleteSpeed = 25;
  const pauseDelay = 2200;

  function type() {
    const current = typewriterPhrases[phraseIndex];
    if (isDeleting) {
      el.textContent = current.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex++;
    }

    let timeout = isDeleting ? deleteSpeed : typeSpeed;

    if (!isDeleting && charIndex === current.length) {
      timeout = pauseDelay;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % typewriterPhrases.length;
      timeout = 400;
    }

    setTimeout(type, timeout);
  }

  type();
}

/* --------------------------------------------------------------------------
   2. Live Clock (IST Timezone)
   -------------------------------------------------------------------------- */
function initLiveClock() {
  const clockEl = document.getElementById('liveTime');
  if (!clockEl) return;

  function update() {
    const now = new Date();
    const options = {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    clockEl.textContent = `IST ${now.toLocaleTimeString('en-US', options)}`;
  }
  update();
  setInterval(update, 1000);
}

/* --------------------------------------------------------------------------
   3. Header Scroll & Mobile Navigation
   -------------------------------------------------------------------------- */
function initHeaderScroll() {
  const header = document.getElementById('navbar');
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  if (mobileBtn && navMenu) {
    mobileBtn.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
      const icon = mobileBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });

    // Close mobile menu on click
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('mobile-open');
        const icon = mobileBtn.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      });
    });
  }

  // Active section spy
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    },
    { rootMargin: '-30% 0px -60% 0px' }
  );

  sections.forEach((sec) => observer.observe(sec));
}

/* --------------------------------------------------------------------------
   4. Skills Matrix Category Filter
   -------------------------------------------------------------------------- */
function initSkillsFilter() {
  const buttons = document.querySelectorAll('.tech-filter-btn');
  const skills = document.querySelectorAll('.skill-item');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      skills.forEach(skill => {
        if (filter === 'all' || skill.getAttribute('data-category') === filter) {
          skill.classList.remove('hidden');
        } else {
          skill.classList.add('hidden');
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   5. Project Search & Category Filter
   -------------------------------------------------------------------------- */
function initProjectControls() {
  const searchInput = document.getElementById('projectSearch');
  const clearBtn = document.getElementById('clearSearchBtn');
  const pills = document.querySelectorAll('.proj-pill');
  const projectCards = document.querySelectorAll('.project-card');

  let currentCategory = 'all';
  let currentSearch = '';

  function applyFilter() {
    projectCards.forEach(card => {
      const category = card.getAttribute('data-category');
      const tags = (card.getAttribute('data-tags') || '').toLowerCase();
      const title = (card.querySelector('.project-title')?.textContent || '').toLowerCase();
      const desc = (card.querySelector('.project-desc')?.textContent || '').toLowerCase();

      const matchesCat = (currentCategory === 'all' || category === currentCategory);
      const matchesSearch = !currentSearch || (title.includes(currentSearch) || desc.includes(currentSearch) || tags.includes(currentSearch));

      if (matchesCat && matchesSearch) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.getAttribute('data-filter');
      applyFilter();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      if (clearBtn) {
        clearBtn.style.display = currentSearch ? 'block' : 'none';
      }
      applyFilter();
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentSearch = '';
      clearBtn.style.display = 'none';
      applyFilter();
      searchInput.focus();
    });
  }
}

/* --------------------------------------------------------------------------
   6. Interactive Terminal Emulator
   -------------------------------------------------------------------------- */
const terminalData = {
  commands: {
    help: `Available commands:
  • <span class="term-cmd">help</span>       - Show this command list
  • <span class="term-cmd">neofetch</span>   - Display developer system telemetry
  • <span class="term-cmd">projects</span>   - List all featured repositories with links
  • <span class="term-cmd">skills</span>     - Display categorized technical skills
  • <span class="term-cmd">about</span>      - Quick bio and engineering focus
  • <span class="term-cmd">contact</span>    - Show contact details & LinkedIn
  • <span class="term-cmd">clear</span>      - Clear terminal screen
  • <span class="term-cmd">repo &lt;name&gt;</span> - Open specific repository on GitHub`,
    
    neofetch: `<pre style="color:var(--accent-amber); font-size:0.8rem; line-height:1.2;">
        /\\         <b>punit@punitr2007-workstation</b>
       /  \\        ----------------------------
      /\\   \\       <b>OS:</b> Arch Linux x86_64
     /      \\      <b>Host:</b> Custom Engineering Rig
    /   ,,   \\     <b>Kernel:</b> 6.12.x-arch1-1
   /   |  |  -\\    <b>Uptime:</b> 24/7 Coding & Building
  /_-''    ''-_\\   <b>Shell:</b> zsh 5.9
                   <b>Languages:</b> C++, Rust, Python, TypeScript, Verilog
                   <b>Frameworks:</b> Tauri v2, mpv/VapourSynth, React 19
                   <b>Editor:</b> Neovim / VS Code
                   <b>Location:</b> New Delhi, India
</pre>`,

    about: `<b>Punit Ranjan (@punitr2007)</b>
Undergraduate Engineering Student at Netaji Subhas University of Technology (NSUT), Delhi.
Specializing in systems development, real-time multimedia AI pipelines, hardware EDA simulators, and native desktop tooling.`,

    skills: `<b>Technical Competencies:</b>
  • <b>Languages:</b> C, C++, Rust, Python, TypeScript, SystemVerilog, VHDL, Lua, Bash, SQL
  • <b>Systems & Media:</b> mpv, VapourSynth, FFmpeg, Vulkan, GLSL Shaders, RIFE AI (ncnn)
  • <b>EDA & Logic:</b> Icarus Verilog, GTKWave, Verilator, GHDL, ModelSim
  • <b>Desktop & Web:</b> Tauri v2, React 19, Next.js 15, Vite, GTK, Tailwind CSS, WASM`,

    projects: `<b>Featured Open Source Repositories:</b>
  1. <a href="https://github.com/punitr2007/Verilog_Tool" target="_blank" style="color:var(--accent-amber)">HDL EDA Studio (Verilog_Tool)</a> - Tauri v2 + Rust EDA Workstation
  2. <a href="https://github.com/punitr2007/SmartPlayer" target="_blank" style="color:var(--accent-amber)">SmartPlayer</a> - Real-time AI 120+ FPS Video Interpolation for mpv
  3. <a href="https://github.com/punitr2007/lsfg-mpv-interpolation-configs" target="_blank" style="color:var(--accent-amber)">lsfg-mpv-interpolation-configs</a> - Vulkan Frame Generation for Linux
  4. <a href="https://github.com/punitr2007/mathstudio" target="_blank" style="color:var(--accent-amber)">MathStudio</a> - Visual LaTeX & MathLive Document Editor
  5. <a href="https://github.com/punitr2007/ims_app" target="_blank" style="color:var(--accent-amber)">IMS NSUT Portal</a> - Next.js 15 Academic Dashboard & Notice Engine
  6. <a href="https://github.com/punitr2007/PDFtools" target="_blank" style="color:var(--accent-amber)">PDFtools</a> - Smart OCR-driven Image-to-Sorted-PDF Builder
  7. <a href="https://github.com/punitr2007/Discmaster" target="_blank" style="color:var(--accent-amber)">DiscMaster</a> - Optical Media Recovery & Transcoding Studio
  8. <a href="https://github.com/punitr2007/Study-Material" target="_blank" style="color:var(--accent-amber)">Study-Material</a> - NSUT Sem 3 Verified Academic Archive`,

    contact: `<b>Reach Out & Connect:</b>
  • <b>Email:</b> <a href="mailto:punitr2007@gmail.com" style="color:var(--accent-cyan)">punitr2007@gmail.com</a>
  • <b>LinkedIn:</b> <a href="https://www.linkedin.com/in/punit-ranjan-53088028a" target="_blank" style="color:var(--accent-cyan)">linkedin.com/in/punit-ranjan-53088028a</a>
  • <b>GitHub:</b> <a href="https://github.com/punitr2007" target="_blank" style="color:var(--accent-cyan)">github.com/punitr2007</a>`
  }
};

function initTerminalEmulator() {
  const terminalInput = document.getElementById('terminalInput');
  const terminalOutput = document.getElementById('terminalOutput');
  const clearBtn = document.getElementById('clearTermBtn');
  const toggleBtn = document.getElementById('terminalToggleBtn');
  const termSection = document.getElementById('terminal');

  if (!terminalInput || !terminalOutput) return;

  const history = [];
  let historyIndex = -1;

  function appendLine(html, isCmd = false) {
    const line = document.createElement('div');
    line.className = 'term-line';
    line.innerHTML = html;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function executeCommand(rawCmd) {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    history.push(cmd);
    historyIndex = history.length;

    // Echo command
    appendLine(`<span class="prompt-user">punit</span><span class="prompt-at">@</span><span class="prompt-host">archlinux</span>:<span class="prompt-path">~</span><span class="prompt-char">$</span> <b>${escapeHtml(cmd)}</b>`, true);

    const parts = cmd.split(' ');
    const mainCmd = parts[0].toLowerCase();

    if (mainCmd === 'clear' || mainCmd === 'cls') {
      terminalOutput.innerHTML = '';
      return;
    }

    if (mainCmd === 'repo') {
      const repoName = parts[1];
      if (!repoName) {
        appendLine(`<span style="color:#e06c75">Usage: repo &lt;name&gt; (e.g. repo Verilog_Tool, repo SmartPlayer)</span>`);
      } else {
        const url = `https://github.com/punitr2007/${repoName}`;
        appendLine(`Opening <a href="${url}" target="_blank" style="color:var(--accent-amber)">${url}</a> in new tab...`);
        window.open(url, '_blank');
      }
      return;
    }

    if (terminalData.commands[mainCmd]) {
      appendLine(terminalData.commands[mainCmd]);
    } else {
      appendLine(`<span style="color:#e06c75">zsh: command not found: ${escapeHtml(mainCmd)}</span>. Type <span class="term-cmd">help</span> for a list of valid commands.`);
    }
  }

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      executeCommand(terminalInput.value);
      terminalInput.value = '';
    } else if (e.key === 'ArrowUp') {
      if (historyIndex > 0) {
        historyIndex--;
        terminalInput.value = history[historyIndex] || '';
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        terminalInput.value = history[historyIndex] || '';
      } else {
        historyIndex = history.length;
        terminalInput.value = '';
      }
      e.preventDefault();
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      terminalOutput.innerHTML = '';
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      terminalOutput.innerHTML = '';
      terminalInput.focus();
    });
  }

  // Ctrl+K Shortcut to focus terminal
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (termSection) {
        termSection.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => terminalInput.focus(), 400);
      }
    }
  });

  if (toggleBtn && termSection) {
    toggleBtn.addEventListener('click', () => {
      termSection.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => terminalInput.focus(), 400);
    });
  }
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

/* --------------------------------------------------------------------------
   7. Project Modals & Architecture Specs
   -------------------------------------------------------------------------- */
const projectModalData = {
  verilog_tool: {
    title: "HDL EDA Studio (Verilog_Tool)",
    badge: "Tauri v2 + Rust Workstation",
    body: `
      <p><b>HDL EDA Studio</b> is a comprehensive standalone native desktop workstation and browser IDE designed for digital logic designers, hardware developers, and electronics engineers.</p>
      <h4>Architectural Highlights</h4>
      <ul>
        <li><b>Native Rust Core:</b> Leverages Tauri v2 with native inter-process communication for local Icarus Verilog and Verilator execution.</li>
        <li><b>Dual Monaco Code Editors:</b> Integrated split-pane editor featuring real-time syntax checking for SystemVerilog, Verilog, and VHDL.</li>
        <li><b>Interactive Waveform Engine:</b> High-DPI canvas-rendered VCD waveform analyzer supporting zoom, multi-cursor time inspection, and bus expansion.</li>
        <li><b>Zero-Config Offline Support:</b> Fully self-contained offline desktop bundles for Linux and web targets.</li>
      </ul>
    `,
    githubUrl: "https://github.com/punitr2007/Verilog_Tool"
  },
  smartplayer: {
    title: "SmartPlayer: Real-Time AI Video Interpolation",
    badge: "Multimedia AI Engine",
    body: `
      <p><b>SmartPlayer</b> transforms standard 24/30 FPS video playback into ultra-fluid 48, 60, and 120+ FPS experiences in real-time within the <code>mpv</code> media player.</p>
      <h4>Key Capabilities</h4>
      <ul>
        <li><b>Neural Motion Estimation:</b> Integrates RIFE (Real-Time Intermediate Flow Estimation) via ncnn-Vulkan for GPU-accelerated deep learning interpolation.</li>
        <li><b>VapourSynth Pipeline:</b> High-throughput asynchronous multi-threaded frame server pipeline.</li>
        <li><b>Interactive OSD Controls:</b> In-player Lua-driven menu allowing instant model switching, FPS multiplier adjustments, and GPU telemetry monitoring.</li>
      </ul>
    `,
    githubUrl: "https://github.com/punitr2007/SmartPlayer"
  },
  lsfg_mpv: {
    title: "Lossless Scaling Frame Generation for mpv",
    badge: "Native Vulkan Linux",
    body: `
      <p><b>lsfg-mpv-interpolation-configs</b> enables native Vulkan swapchain frame generation for Linux desktops, providing buttery-smooth video rendering.</p>
      <h4>Technical Specs</h4>
      <ul>
        <li><b>Vulkan 1.3 Swapchain Hook:</b> Direct presentation layer frame duplication and interpolation.</li>
        <li><b>Wayland & X11 Native:</b> Zero tearing across modern compositor environments.</li>
        <li><b>One-Command CLI Wrapper:</b> Instant launching with predefined profile configs for 72Hz, 96Hz, and 144Hz displays.</li>
      </ul>
    `,
    githubUrl: "https://github.com/punitr2007/lsfg-mpv-interpolation-configs"
  },
  mathstudio: {
    title: "MathStudio: Visual Mathematical Assignment Suite",
    badge: "React 19 + TypeScript",
    body: `
      <p><b>MathStudio</b> is a fast, keyboard-first visual mathematical document editor built for students and researchers solving complex assignments.</p>
      <h4>Features & Architecture</h4>
      <ul>
        <li><b>CortexJS MathLive:</b> Interactive WYSIWYG LaTeX formula editor with instant rendering.</li>
        <li><b>Split-Screen PDF Problem Viewer:</b> Integrated PDF viewer with side-by-side answer drafting.</li>
        <li><b>Multi-Format Export:</b> Export to publication-ready PDF, standard LaTeX source, or Markdown.</li>
      </ul>
    `,
    githubUrl: "https://github.com/punitr2007/mathstudio"
  },
  ims_app: {
    title: "IMS NSUT Portal & Ingestion Engine",
    badge: "Next.js 15 Full-Stack",
    body: `
      <p><b>IMS NSUT Portal</b> is a high-performance web dashboard & background scraper for Netaji Subhas University of Technology.</p>
      <h4>Capabilities</h4>
      <ul>
        <li><b>Sub-10ms Fuzzy Circular Search:</b> Instant search across 10,000+ historical administrative notices and circulars.</li>
        <li><b>Attendance Margin Analytics:</b> Smart calculator computing exact bunk allowances to maintain 75% university attendance threshold.</li>
        <li><b>Automated Notice Sync:</b> GitHub Actions background workflows running hourly circular scrapers with Tesseract OCR captcha solving.</li>
      </ul>
    `,
    githubUrl: "https://github.com/punitr2007/ims_app"
  },
  pdftools: {
    title: "PDFtools: Smart Image-to-Sorted-PDF Builder",
    badge: "OCR & Heuristic Sorting",
    body: `
      <p><b>PDFtools</b> automatically sequences disorganized screenshot images and assignment questions into ordered publication PDFs.</p>
      <h4>Workflow</h4>
      <ul>
        <li><b>Tesseract OCR Extraction:</b> Identifies question indices (`Q1`, `1.`, `Question 3`) from image regions.</li>
        <li><b>Natural Numerical Sorting:</b> Sequences multi-digit assignments numerically (`1, 2, ..., 10`) rather than alphabetically.</li>
        <li><b>Batch Image Processing:</b> High-resolution Pillow image rendering with lossless PDF compression.</li>
      </ul>
    `,
    githubUrl: "https://github.com/punitr2007/PDFtools"
  },
  discmaster: {
    title: "DiscMaster: Optical Media Recovery Studio",
    badge: "Desktop Audio/Video Tool",
    body: `
      <p><b>DiscMaster</b> is a classic desktop studio designed to rip, recover, transcode, stitch, and inspect legacy optical media (VCD, DVD, Audio CD, BIN/CUE, CD-ROM XA dumps).</p>
      <h4>Features</h4>
      <ul>
        <li><b>Multi-Format Transcoding:</b> FFmpeg-powered multi-threaded conversion to modern MP4, MKV, and FLAC formats.</li>
        <li><b>Sector Inspection & Recovery:</b> Error correction for scratched and legacy discs.</li>
        <li><b>AppImage Packaging:</b> Portable single-binary distribution for all Linux distributions.</li>
      </ul>
    `,
    githubUrl: "https://github.com/punitr2007/Discmaster"
  },
  study_material: {
    title: "NSUT Engineering Academic Archive",
    badge: "OCR-Classified Academic Store",
    body: `
      <p><b>Study-Material</b> is a comprehensive course archive for NSUT 3rd Semester (ECE, ECAM, ICE, and allied branches).</p>
      <h4>Contents</h4>
      <ul>
        <li><b>OCR-Categorized PYQs:</b> University question papers classified into Mid-Semester, End-Semester, and Summer-Semester terms.</li>
        <li><b>Course Notes & Slides:</b> Unit-wise lecture notes, slide decks, and batch topper handwritten notes.</li>
        <li><b>Reference Textbooks:</b> Standard textbook references (Oppenheim, Morris Mano, Papoulis, Tarun Rawat).</li>
      </ul>
    `,
    githubUrl: "https://github.com/punitr2007/Study-Material"
  }
};

function initProjectModals() {
  const modal = document.getElementById('projectModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBadge = document.getElementById('modalBadge');
  const modalBody = document.getElementById('modalBody');
  const modalFooter = document.getElementById('modalFooter');
  const closeBtn = document.getElementById('modalCloseBtn');
  const openButtons = document.querySelectorAll('.open-modal-btn');

  if (!modal || !modalTitle || !modalBody || !modalFooter) return;

  function openModal(projKey) {
    const data = projectModalData[projKey];
    if (!data) return;

    modalTitle.textContent = data.title;
    modalBadge.textContent = data.badge;
    modalBody.innerHTML = data.body;
    modalFooter.innerHTML = `
      <a href="${data.githubUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
        <i class="fa-brands fa-github"></i> Open on GitHub
      </a>
    `;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  openButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-project');
      openModal(key);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/* --------------------------------------------------------------------------
   8. Clipboard & Toast Notifications
   -------------------------------------------------------------------------- */
function showToast(message, icon = 'fa-check') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid ${icon}" style="color:var(--accent-amber)"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function initClipboardActions() {
  document.querySelectorAll('.copy-email-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-email') || 'punitr2007@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        showToast(`Copied ${email} to clipboard!`, 'fa-copy');
      }).catch(() => {
        showToast(`Email: ${email}`, 'fa-envelope');
      });
    });
  });
}

/* --------------------------------------------------------------------------
   9. Live GitHub API Telemetry & Star Count
   -------------------------------------------------------------------------- */
async function initGithubStats() {
  try {
    const userRes = await fetch('https://api.github.com/users/punitr2007');
    if (userRes.ok) {
      const userData = await userRes.json();
      const reposCountEl = document.getElementById('heroReposCount');
      if (reposCountEl && userData.public_repos) {
        reposCountEl.textContent = `${userData.public_repos}+`;
      }
    }

    // Fetch individual repo stars
    const starBadges = document.querySelectorAll('.repo-meta-badges .meta-badge.stars');
    starBadges.forEach(async (badge) => {
      const repoPath = badge.getAttribute('data-repo');
      if (!repoPath) return;

      try {
        const repoRes = await fetch(`https://api.github.com/repos/${repoPath}`);
        if (repoRes.ok) {
          const repoData = await repoRes.json();
          const countSpan = badge.querySelector('.count');
          if (countSpan && repoData.stargazers_count !== undefined) {
            countSpan.textContent = repoData.stargazers_count;
          }
        }
      } catch (err) {
        // graceful offline fallback
      }
    });
  } catch (e) {
    // offline or rate limited
  }
}
