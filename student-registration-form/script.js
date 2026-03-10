document.addEventListener('DOMContentLoaded', () => {

    /* ── DOM refs ─────────────────────────────────────── */
    const form = document.getElementById('registrationForm');
    const submitBtn = document.getElementById('submitBtn');
    const formView = document.getElementById('formView');
    const successView = document.getElementById('successView');
    const successName = document.getElementById('successName');
    const successDets = document.getElementById('successDetails');
    const regoBtn = document.getElementById('registerAgainBtn');
    const togglePw = document.getElementById('togglePw');
    const pwInput = document.getElementById('password');
    const progressBar = document.getElementById('progressBar');
    const progressLbl = document.getElementById('progressLabel');
    const strengthRow = document.getElementById('strengthRow');
    const segs = [1, 2, 3, 4].map(n => document.getElementById(`s${n}`));

    const TOTAL_FIELDS = 7; // name, sid, email, phone, course, gender, password, confirm, terms → 9 but we group

    /* ── Password toggle ─────────────────────────────── */
    togglePw.addEventListener('click', () => {
        const show = pwInput.type === 'password';
        pwInput.type = show ? 'text' : 'password';
        togglePw.querySelector('i').className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    });

    /* ── Strength bar ────────────────────────────────── */
    function strength(v) {
        let s = 0;
        if (v.length >= 8) s++;
        if (/[A-Z]/.test(v)) s++;
        if (/[0-9]/.test(v)) s++;
        if (/[^A-Za-z0-9]/.test(v)) s++;
        return s;
    }
    function updateStrength(v) {
        const sc = v.length ? strength(v) : 0;
        segs.forEach((seg, i) => {
            seg.className = 'seg';
            if (i < sc) seg.classList.add(`s${sc}`);
        });
    }

    /* ── Progress bar ────────────────────────────────── */
    function updateProgress() {
        const fields = [
            document.getElementById('grp-name'),
            document.getElementById('grp-sid'),
            document.getElementById('grp-email'),
            document.getElementById('grp-phone'),
            document.getElementById('grp-course'),
            document.getElementById('grp-gender'),
            document.getElementById('grp-password'),
            document.getElementById('grp-confirm'),
        ];
        const done = fields.filter(f => f && f.classList.contains('valid')).length;
        const pct = Math.round((done / fields.length) * 100);
        progressBar.style.width = pct + '%';
        progressLbl.textContent = `${done} / ${fields.length} fields complete`;
        const pctEl = document.getElementById('progressPct');
        if (pctEl) pctEl.textContent = pct + '%';
    }

    /* ── Validation rules ──────────────────────────── */
    const rules = {
        name: { el: () => document.getElementById('name'), grp: 'grp-name', err: 'err-name', test: v => v.trim().length >= 2 },
        sid: { el: () => document.getElementById('sid'), grp: 'grp-sid', err: 'err-sid', test: v => /^STU-\d{4}-\d{4}$/i.test(v.trim()) },
        email: { el: () => document.getElementById('email'), grp: 'grp-email', err: 'err-email', test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
        phone: { el: () => document.getElementById('phone'), grp: 'grp-phone', err: 'err-phone', test: v => /^\+?[\d\s\-(). ]{10,}$/.test(v.trim()) },
        course: { el: () => document.getElementById('course'), grp: 'grp-course', err: 'err-course', test: v => v !== '' },
        password: { el: () => document.getElementById('password'), grp: 'grp-password', err: 'err-password', test: v => v.length >= 8 },
        confirm: { el: () => document.getElementById('confirm'), grp: 'grp-confirm', err: 'err-confirm', test: v => v === document.getElementById('password').value && v.length > 0 },
    };

    /* Gender (radio) */
    function validateGender() {
        const grp = document.getElementById('grp-gender');
        const checked = document.querySelector('input[name="gender"]:checked');
        grp.classList.toggle('valid', !!checked);
        grp.classList.toggle('invalid', !checked);
        updateProgress();
        checkSubmit();
    }

    /* Terms */
    function validateTerms() {
        const chk = document.getElementById('terms');
        const el = document.getElementById('grp-terms');
        const err = document.getElementById('err-terms');
        const ok = chk.checked;
        err.style.height = ok ? '0' : '14px';
        err.style.opacity = ok ? '0' : '1';
        return ok;
    }

    function validateField(key) {
        const rule = rules[key];
        const el = rule.el();
        const val = el.value;
        const grp = document.getElementById(rule.grp);

        if (key === 'password') updateStrength(val);

        if (val.trim() === '') {
            grp.classList.remove('valid', 'invalid');
        } else {
            const ok = rule.test(val);
            grp.classList.toggle('valid', ok);
            grp.classList.toggle('invalid', !ok);
        }
        updateProgress();
        checkSubmit();
    }

    function checkSubmit() {
        const allFieldsValid = Object.keys(rules).every(k => {
            const grp = document.getElementById(rules[k].grp);
            return grp && grp.classList.contains('valid');
        });
        const genderOk = document.querySelector('input[name="gender"]:checked');
        const termsOk = document.getElementById('terms').checked;
        submitBtn.disabled = !(allFieldsValid && genderOk && termsOk);
    }

    /* Attach input listeners */
    Object.keys(rules).forEach(key => {
        const el = rules[key].el();
        if (!el) return;
        const evt = (el.tagName === 'SELECT') ? 'change' : 'input';
        el.addEventListener(evt, () => {
            validateField(key);
            if (key === 'password') {
                const cv = document.getElementById('confirm').value;
                if (cv.length > 0) validateField('confirm');
            }
        });
        el.addEventListener('blur', () => {
            if (el.value.trim() !== '') validateField(key);
        });
    });

    document.querySelectorAll('input[name="gender"]').forEach(r =>
        r.addEventListener('change', validateGender)
    );
    document.getElementById('terms').addEventListener('change', () => { validateTerms(); checkSubmit(); });

    /* ── Submit ──────────────────────────────────────── */
    form.addEventListener('submit', e => {
        e.preventDefault();
        if (submitBtn.disabled) return;

        /* Validate terms explicitly */
        if (!validateTerms()) { checkSubmit(); return; }

        /* Button loading state */
        submitBtn.querySelector('.btn-text').style.display = 'none';
        submitBtn.querySelector('.btn-loader').style.display = 'flex';
        submitBtn.disabled = true;

        setTimeout(() => {
            /* Build success details */
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const sid = document.getElementById('sid').value;
            const course = document.getElementById('course').value;
            const gender = document.querySelector('input[name="gender"]:checked')?.value || '—';

            successName.textContent = `Hi ${name.split(' ')[0]}! Your account is ready.`;
            successDets.innerHTML = `
                <div class="detail-row"><span class="lbl">Name</span><span>${name}</span></div>
                <div class="detail-row"><span class="lbl">Student ID</span><span>${sid}</span></div>
                <div class="detail-row"><span class="lbl">Email</span><span>${email}</span></div>
                <div class="detail-row"><span class="lbl">Course</span><span>${course}</span></div>
                <div class="detail-row"><span class="lbl">Gender</span><span style="text-transform:capitalize">${gender}</span></div>
            `;

            /* Swap views */
            formView.style.display = 'none';
            successView.style.display = 'flex';
            successView.classList.add('active');
        }, 1400);
    });

    /* ── Reset / register again ───────────────────── */
    regoBtn.addEventListener('click', () => {
        form.reset();
        document.querySelectorAll('.form-group').forEach(g => g.classList.remove('valid', 'invalid'));
        progressBar.style.width = '0%';
        progressLbl.textContent = '0 / 8 fields complete';
        segs.forEach(s => s.className = 'seg');
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').style.display = 'flex';
        submitBtn.querySelector('.btn-loader').style.display = 'none';

        successView.style.display = 'none';
        successView.classList.remove('active');
        formView.style.display = 'block';
    });

    /* Initial state */
    checkSubmit();
});
