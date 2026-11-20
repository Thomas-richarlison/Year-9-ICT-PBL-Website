/* =========================================================================
   main.js — Year 9 ICT PBL: Myanmar Fire Awareness website
   -------------------------------------------------------------------------
   PURPOSE
     The single custom JavaScript file that powers the website. It handles:
       • navbar: scroll state + active-page underline highlight
       • Info page tab switching (click a tab to show its panel)
       • contact form validation (English-only messages)
       • GSAP entrance / scroll-reveal animations
       • footer year, back-to-top button, smooth in-page anchor scrolling

   DEPENDENCIES (loaded from ../vendor/ via <script> tags in each HTML page)
     • Bootstrap 5  — mobile navbar collapse, dropdown, carousel.
     • GSAP         — entrance and count-up animations.
     Both are optional at runtime: the file checks `window.gsap` and
     `window.bootstrap` before using them and gracefully degrades.

   The bilingual (English / Burmese) switching and the light/dark theme
   toggle that used to live here have been removed — the site is now
   English-only and always light.
   ========================================================================= */


/* =========================================================================
   1. SHORTCUT HELPER FUNCTIONS
   ========================================================================= */

// Query a SINGLE element. Defaults to the whole document, but you can pass
// a `scope` (e.g. a parent element) to search inside it only.
const $  = (selector, scope = document) => scope.querySelector(selector);

// Query ALL matching elements. Array.from converts the NodeList into a real
// Array so array methods (.map, .filter, .forEach) work on it.
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));


/* =========================================================================
   2. CONSTANTS & SITE-WIDE SETTINGS
   ========================================================================= */

// Read the current page identifier from <body data-page="..."> in the HTML.
// Falls back to 'home' if the attribute is missing.
const CURRENT_PAGE = document.body.getAttribute('data-page') || 'home';

// True if the user's OS / browser is set to "reduce motion". We use this to
// skip GSAP animations so the site respects the visitor's accessibility wish.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* =========================================================================
   3. NAVBAR INITIALISATION
   -------------------------------------------------------------------------
   Sets up the top navigation bar:
     • adds an `is-scrolled` class once the user scrolls down a few pixels
       (CSS uses this to give the navbar a solid background / shadow)
     • highlights the nav link of the current page by comparing each link's
       data-navlink attribute against <body data-page="...">
     • auto-closes the mobile (hamburger) menu after a link or dropdown item
       is tapped, using Bootstrap's Collapse API
   ========================================================================= */
function initNavbar() {
  const navbar = $('#siteNavbar');
  if (!navbar) return;

  // Toggle the `is-scrolled` class depending on whether the page has been
  // scrolled more than 12px. { passive: true } keeps scrolling smooth.
  const updateScrolledState = () => {
    const scrolled = window.scrollY > 12;
    navbar.classList.toggle('is-scrolled', scrolled);
  };
  window.addEventListener('scroll', updateScrolledState, { passive: true });
  updateScrolledState();

  // Mark the nav link matching the current page as active (is-active class).
  // Each link has data-navlink="home" etc.; <body data-page="home"> tells us
  // which page we're on (stored in CURRENT_PAGE). The CSS shows an underline
  // for any .nav-link.is-active element.
  $$('.navbar .nav-link[data-navlink]').forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('data-navlink') === CURRENT_PAGE);
  });

  // On mobile, the menu is a Bootstrap Collapse. After tapping a link OR a
  // dropdown item, hide the menu so it doesn't stay open over the content.
  const collapseElement = $('#mainMenu');
  const closeMobileMenu = () => {
    if (!collapseElement || !collapseElement.classList.contains('show')) return;
    const bsCollapse = window.bootstrap && bootstrap.Collapse.getInstance(collapseElement);
    if (bsCollapse) bsCollapse.hide();
  };
  $$('.navbar .nav-link, .navbar .dropdown-item').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });
}


/* =========================================================================
   4. INFO PAGE TABS
   -------------------------------------------------------------------------
   The Info page has a sticky list of tabs (causes / stats / prepared / refs)
   on the left and a column of panels on the right. Clicking a tab shows ONLY
   its panel — the others are hidden. The active tab gets a highlighted look.
   The statistics numbers count up from 0 the first time the stats panel opens.
   ========================================================================= */

// Remembers whether the count-up animation has already run, so re-opening the
// stats tab does not restart the animation every time.
let statsCounted = false;

// Switch the visible panel to the one matching `tabName`. Updates both the
// tab buttons (is-open class + aria-current) and the panels themselves
// (is-open class shows the panel; CSS hides the rest with display:none).
function setActiveInfoTab(tabName) {
  const tablist = $('#infoTabs');
  if (!tablist) return;

  // 1. Update the tab buttons.
  $$('.info-tab', tablist).forEach((tab) => {
    const href = tab.getAttribute('href') || '';
    const name = href.replace('#panel-', '');
    const isActive = name === tabName;
    tab.classList.toggle('is-open', isActive);
    if (isActive) {
      tab.setAttribute('aria-current', 'true');
    } else {
      tab.removeAttribute('aria-current');
    }
  });

  // 2. Update the panels: show only the matching one.
  $$('.info-panel').forEach((panel) => {
    const id = panel.id || '';
    const name = id.replace('panel-', '');
    panel.classList.toggle('is-open', name === tabName);
  });

  // 3. First time the stats tab is opened, kick off the count-up animation.
  if (tabName === 'stats' && !statsCounted) {
    statsCounted = true;
    countUpStatistics();
  }
}

// Animate every [data-countup] element from 0 up to its target number. If the
// user prefers reduced motion, or GSAP isn't loaded, we just set the final
// value immediately with no animation.
function countUpStatistics() {
  const counters = $$('[data-countup]');
  if (!counters.length) return;

  // Reduced-motion / no-GSAP path: jump straight to the final value.
  if (prefersReducedMotion || !window.gsap) {
    counters.forEach((element) => {
      const target = parseInt(element.getAttribute('data-countup'), 10);
      if (!Number.isNaN(target)) {
        element.textContent = target.toLocaleString('en-US');
      }
    });
    return;
  }

  // Animated path: for each counter, create a tweenable object { value: 0 }
  // and use gsap.to() to animate its `value` up to the target.
  counters.forEach((element) => {
    const target = parseInt(element.getAttribute('data-countup'), 10);
    if (Number.isNaN(target)) return;

    const counter = { value: 0 };
    gsap.to(counter, {
      value: target,
      duration: 1.4,
      ease: 'power2.out',
      snap: { value: 1 },
      onUpdate: () => {
        element.textContent = Math.round(counter.value).toLocaleString('en-US');
      },
      onComplete: () => {
        element.textContent = target.toLocaleString('en-US');
      }
    });
  });
}

// Map a deep-link hash (the part after "#" in the URL) to the name of the
// Info-page tab it should activate. The emergency-numbers anchor lives inside
// the Preparedness panel, so opening it means activating "prepared".
const HASH_TO_TAB = {
  'panel-causes': 'causes',
  'panel-stats': 'stats',
  'panel-prepared': 'prepared',
  'panel-refs': 'refs',
  'emergency-numbers': 'prepared'
};

// Read the URL hash and switch the Info panel to match. If the hash targets a
// sub-anchor inside a panel (e.g. #emergency-numbers inside Preparedness),
// also scroll that anchor into view. Returns true if the hash was handled.
function handleInfoHash() {
  const hash = (window.location.hash || '').replace('#', '');
  if (!hash) return false;

  const tabName = HASH_TO_TAB[hash];
  if (!tabName) return false;

  setActiveInfoTab(tabName);

  // If the deep-link target is a sub-anchor (e.g. emergency-numbers), scroll
  // it into view inside the now-visible panel.
  const target = document.getElementById(hash);
  if (target) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    });
  }
  return true;
}

// Wire up everything tab-related on the Info page: click handlers on the
// tabs that switch the visible panel, deep-linking via the URL hash so that
// info.html#panel-stats opens straight to the stats panel, AND a hashchange
// listener so that clicking a navbar dropdown item (e.g. "References") while
// already on info.html actually switches panels instead of just changing
// the URL with no visible effect.
function initInfoTabs() {
  const tablist = $('#infoTabs');
  if (!tablist) return;

  // When a tab is clicked, switch to that panel and update the URL hash
  // (without adding a new history entry) so the link is shareable.
  $$('.info-tab', tablist).forEach((tab) => {
    tab.addEventListener('click', (event) => {
      const href = tab.getAttribute('href') || '';
      if (href.startsWith('#')) {
        event.preventDefault();
        const name = href.replace('#panel-', '');
        setActiveInfoTab(name);
        if (history.replaceState) {
          history.replaceState(null, '', href);
        }
        // Move keyboard focus to the now-visible panel for accessibility.
        const target = document.getElementById(href.slice(1));
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      }
    });
  });

  // Deep linking on initial load: if the page was opened with a hash like
  // #panel-stats, open that panel straight away. If there is no recognised
  // hash, default to the first tab (causes).
  if (!handleInfoHash()) {
    setActiveInfoTab('causes');
  }

  // Listen for hash changes after the page has loaded. This is what makes
  // the navbar "Info" dropdown items work when the user is already on
  // info.html: clicking e.g. "References" only updates the URL hash (the
  // browser does not reload the page), so without this listener the panel
  // would never switch.
  window.addEventListener('hashchange', handleInfoHash);
}


/* =========================================================================
   5. CONTACT FORM VALIDATION
   -------------------------------------------------------------------------
   Client-side validation for the contact form (#contactForm), modelled on the
   Test_C1_form_validation reference. Each field is checked LIVE as the user
   types (on `input` / `change`), shows a green ✓ when valid and a red message
   when invalid. The same checks are repeated on submit. If anything fails on
   submit we focus the first invalid field and stop. If everything passes, we
   hide the form and show a success message.

   IMPORTANT: the email check accepts ANY normal email address — it is NOT
   restricted to a school gmail / edusnschool domain. The pattern only
   verifies the general "local-part@domain.tld" shape.
   ========================================================================= */

// Hard-coded English validation messages.
const FORM_ERRORS = {
  nameEmpty:  'Name is required.',
  nameWords:  'Name must contain at least 2 words.',
  emailEmpty: 'Email is required.',
  emailBad:   'Please enter a valid email address.',
  phoneEmpty: 'Phone number is required.',
  phoneLet:   "You can't input letters inside the form.",
  phoneLen:   'Phone number must be exactly 11 digits long.',
  phoneStart: 'Phone number must start with 09.',
  subject:    'Please choose a subject.',
  msgEmpty:   'Message is required.',
  msgWords:   'Please type at least 30 words.'
};

// A small green tick shown next to a valid field (matches the ✅ used in the
// reference Test_C1 form, but using a Bootstrap icon so it renders in any
// font). The colour comes from the `.field-error.is-ok` CSS rule.
const FIELD_OK = '<i class="bi bi-check2-circle" aria-hidden="true"></i>';

// Show an ERROR (red text) under a field. `message` is plain text.
function setFieldError(inputElement, errorElement, message) {
  if (!errorElement) return;
  if (message) {
    errorElement.classList.remove('is-ok');
    errorElement.textContent = message;
    errorElement.hidden = false;
    if (inputElement) inputElement.setAttribute('aria-invalid', 'true');
  } else {
    errorElement.textContent = '';
    errorElement.hidden = true;
    errorElement.classList.remove('is-ok');
    if (inputElement) inputElement.removeAttribute('aria-invalid');
  }
}

// Show a SUCCESS indicator (green tick) under a field.
function setFieldOk(inputElement, errorElement) {
  if (!errorElement) return;
  errorElement.innerHTML = FIELD_OK;
  errorElement.classList.add('is-ok');
  errorElement.hidden = false;
  if (inputElement) inputElement.removeAttribute('aria-invalid');
}

// --- Individual field validators -----------------------------------------
//   Each returns true (valid) / false (invalid) and updates the matching
//   error element as a side-effect. They are safe to call on every keystroke.

function validateName() {
  const name  = $('#cfName');
  const err   = $('#cfNameError');
  if (!name || !err) return true;
  const value = name.value.trim();

  if (value.length === 0) {
    setFieldError(name, err, FORM_ERRORS.nameEmpty);
    return false;
  }
  // Must contain at least 2 words (letters only, separated by spaces) —
  // mirrors the rule in Test_C1_form_validation.js.
  if (!value.match(/^[A-Za-z]+(\s+[A-Za-z]+)+$/)) {
    setFieldError(name, err, FORM_ERRORS.nameWords);
    return false;
  }
  setFieldOk(name, err);
  return true;
}

function validateEmail() {
  const email = $('#cfEmail');
  const err   = $('#cfEmailError');
  if (!email || !err) return true;
  const value = email.value.trim();

  if (value.length === 0) {
    setFieldError(email, err, FORM_ERRORS.emailEmpty);
    return false;
  }
  // Normal email pattern — accepts any domain (gmail, outlook, school,
  // company, etc.). NOT restricted to a school address.
  if (!value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
    setFieldError(email, err, FORM_ERRORS.emailBad);
    return false;
  }
  setFieldOk(email, err);
  return true;
}

function validatePhone() {
  const phone = $('#cfPhone');
  const err   = $('#cfPhoneError');
  if (!phone || !err) return true;
  const value = phone.value.trim();

  // 1) Required.
  if (value.length === 0) {
    setFieldError(phone, err, FORM_ERRORS.phoneEmpty);
    return false;
  }

  // 2) Letters are not allowed anywhere in the phone number.
  //    This is checked BEFORE the length / prefix rules so the user gets
  //    the clearest possible feedback for the most basic mistake.
  if (/[A-Za-z]/.test(value)) {
    setFieldError(phone, err, FORM_ERRORS.phoneLet);
    return false;
  }

  // 3) Exactly 11 digits, no more and no less.
  if (value.length !== 11) {
    setFieldError(phone, err, FORM_ERRORS.phoneLen);
    return false;
  }

  // 4) Must be all digits at this point (no letters, length is 11).
  //    Anything non-digit (symbol, space, punctuation) is treated as a
  //    length/shape problem and reported with the digits-only message.
  if (!/^[0-9]{11}$/.test(value)) {
    setFieldError(phone, err, FORM_ERRORS.phoneLen);
    return false;
  }

  // 5) Must start with 09.
  if (!value.startsWith('09')) {
    setFieldError(phone, err, FORM_ERRORS.phoneStart);
    return false;
  }

  setFieldOk(phone, err);
  return true;
}

function validateSubject() {
  const subject = $('#cfSubject');
  const err     = $('#cfSubjectError');
  if (!subject || !err) return true;

  if (subject.value === '') {
    setFieldError(subject, err, FORM_ERRORS.subject);
    return false;
  }
  setFieldOk(subject, err);
  return true;
}

function validateMessage() {
  const message = $('#cfMessage');
  const err     = $('#cfMessageError');
  if (!message || !err) return true;
  const value = message.value.trim();

  if (value.length === 0) {
    setFieldError(message, err, FORM_ERRORS.msgEmpty);
    return false;
  }
  // Count words (any run of non-whitespace counts as one word). The
  // reference form requires at least 30 words.
  const words = value.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 30) {
    const left = 30 - words.length;
    setFieldError(message, err, `${left} more word${left === 1 ? '' : 's'} required.`);
    return false;
  }
  setFieldOk(message, err);
  return true;
}

// Run every validator and return true only if all pass.
function validateContactForm() {
  // Each call updates its own error slot, so we just need the combined
  // boolean result. We call them all (no short-circuit) so every invalid
  // field shows its message on submit.
  const okName    = validateName();
  const okEmail   = validateEmail();
  const okPhone   = validatePhone();
  const okSubject = validateSubject();
  const okMessage = validateMessage();
  return okName && okEmail && okPhone && okSubject && okMessage;
}

// Wire up the contact form: live validation on input/change, the submit
// handler, and the "send another message" button on the success screen.
function initContactForm() {
  const form = $('#contactForm');
  if (!form) return;

  // --- Live validation (mirrors the onkeyup handlers in the reference) ---
  // `input` fires on every keystroke / paste / cut for text fields and
  // textareas; `change` fires for selects when the user picks an option.
  const nameEl    = $('#cfName');
  const emailEl   = $('#cfEmail');
  const phoneEl   = $('#cfPhone');
  const subjectEl = $('#cfSubject');
  const messageEl = $('#cfMessage');

  if (nameEl)    nameEl.addEventListener('input',    validateName);
  if (emailEl)   emailEl.addEventListener('input',   validateEmail);
  if (phoneEl)   phoneEl.addEventListener('input',   validatePhone);
  if (subjectEl) subjectEl.addEventListener('change', validateSubject);
  if (messageEl) messageEl.addEventListener('input',  validateMessage);

  // --- Submit handler ---
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validateContactForm()) {
      // Move keyboard focus to the first invalid field for accessibility.
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Success: hide the form and show the thank-you message.
    form.hidden = true;
    const success = $('#contactSuccess');
    if (success) {
      success.hidden = false;
      if (window.gsap && !prefersReducedMotion) {
        gsap.fromTo(success, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
      }
      // Move focus to the success message so screen-reader users hear it.
      if (success.focus) success.focus({ preventScroll: true });
    }
  });

  // "Send another message" button: reset the form, hide the success panel,
  // show the form again, and put focus back in the name field.
  const again = $('#contactAgain');
  if (again) {
    again.addEventListener('click', () => {
      form.reset();
      // Also clear any leftover error / tick messages.
      ['#cfNameError', '#cfEmailError', '#cfPhoneError', '#cfSubjectError', '#cfMessageError']
        .forEach((id) => {
          const el = $(id);
          if (el) { el.textContent = ''; el.hidden = true; el.classList.remove('is-ok'); }
        });
      const success = $('#contactSuccess');
      if (success) success.hidden = true;
      form.hidden = false;
      const name = $('#cfName');
      if (name) name.focus();
    });
  }
}


/* =========================================================================
   6. GSAP ANIMATIONS
   -------------------------------------------------------------------------
   Decorative entrance and scroll-reveal animations. Everything here is
   optional: if GSAP isn't loaded, or if the user prefers reduced motion, we
   skip the animations entirely and the page just appears normally.
   ========================================================================= */
function initAnimations() {
  if (!window.gsap) return;
  if (prefersReducedMotion) return;

  // Add a class to <html> so the CSS can know JS animations are running.
  document.documentElement.classList.add('js-anim');

  // Intro 1: navbar slides down from above and fades in.
  gsap.from('#siteNavbar', {
    y: -56,
    opacity: 0,
    duration: 0.7,
    ease: 'power2.out',
    delay: 0.05
  });

  // Intro 2: hero / page-header elements rise and fade in, staggered.
  gsap.from('.hero-anim, .page-header-anim', {
    y: 24,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.09,
    delay: 0.15
  });

  // Scroll-reveal: collect every element matching the selectors below. We
  // skip any that live inside an .info-panel (the Info page handles its own
  // reveals) and any hero/page-header ones (they already animated above).
  const scrollAnimatedSelectors = [
    '.section-title',
    '.eyebrow',
    '.lead-text',
    '.pull-quote',
    '.anim-cards .anim-card',
    '.anim-list li',
    '.placeholder-box',
    '.qna-item',
    '.anim-pop'
  ];

  const scrollAnimatedElements = [];
  scrollAnimatedSelectors.forEach((selector) => {
    $$(selector).forEach((element) => {
      if (element.closest('.info-panel')) return;
      if (element.classList.contains('hero-anim') || element.classList.contains('page-header-anim')) return;
      scrollAnimatedElements.push(element);
    });
  });

  // IntersectionObserver: each time an element scrolls into view, add the
  // `is-visible` class (the CSS defines the fade-in for that class).
  if (typeof IntersectionObserver !== 'undefined' && scrollAnimatedElements.length) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    scrollAnimatedElements.forEach((el) => observer.observe(el));

    // Safety net: some browsers fire the observer late on initial load.
    setTimeout(() => {
      const viewportH = window.innerHeight;
      scrollAnimatedElements.forEach((el) => {
        if (el.classList.contains('is-visible')) return;
        const r = el.getBoundingClientRect();
        if (r.top < viewportH * 0.92) {
          el.classList.add('is-visible');
        }
      });
    }, 100);
  } else {
    // IntersectionObserver not supported: show everything immediately.
    scrollAnimatedElements.forEach((el) => el.classList.add('is-visible'));
  }
}


/* =========================================================================
   7. FOOTER YEAR
   -------------------------------------------------------------------------
   Writes the current project year into the <span id="footerYear"> element in
   the footer of every page. The year is hard-coded (not auto-detected from
   the system clock) so the copyright line stays consistent regardless of when
   a visitor opens the site.
   ========================================================================= */

const PROJECT_YEAR = '2026';

function initFooterYear() {
  const yearElement = $('#footerYear');
  if (!yearElement) return;
  yearElement.textContent = PROJECT_YEAR;
}


/* =========================================================================
   8. BACK-TO-TOP & SMOOTH ANCHOR SCROLLING
   ========================================================================= */

function initBackToTop() {
  const link = $('#backToTop');
  if (!link) return;

  link.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });

    // Move focus to #main-content so keyboard / screen-reader users aren't
    // left focused on the back-to-top button.
    const skipTarget = $('#main-content');
    if (skipTarget) {
      skipTarget.setAttribute('tabindex', '-1');
      skipTarget.focus({ preventScroll: true });
    }
  });
}

// For every link that points to an in-page anchor (a[href^="#"]), intercept
// the click and smooth-scroll to the target instead. The 84px offset
// accounts for the height of the fixed navbar so headings aren't hidden.
// NOTE: the Info page's tab links are handled separately by initInfoTabs,
// so we skip any link that lives inside #infoTabs here.
function initSmoothAnchors() {
  $$('a[href^="#"]').forEach((link) => {
    if (link.closest('#infoTabs')) return; // Info tabs handle their own clicks
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;

      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });

      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
}


/* =========================================================================
   9. DOMContentLoaded BOOTSTRAP
   -------------------------------------------------------------------------
   The browser fires DOMContentLoaded once the HTML has been parsed. Inside
   this handler we call every init* function in the right order. Each one
   no-ops if its target element isn't on the current page, so it's safe to
   call them on every page.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initInfoTabs();
  initContactForm();
  initFooterYear();
  initBackToTop();
  initSmoothAnchors();
  initAnimations();
});
