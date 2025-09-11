window.addEventListener('load', function() {
    
    // --- CORE FORM LOGIC ---
    let currentStep = 1;
    const form = document.getElementById('research-form');
    const formSections = Array.from(form.querySelectorAll('.form-section'));
    const progressBarFill = document.getElementById('progressBarFill');
    const progressLabels = Array.from(document.querySelectorAll('.progress-label'));

    // --- Dynamic Header Icon Setup ---
    const headerIconImg = document.getElementById('header-icon-img');
    const iconUrls = [
        "https://github.com/Hewg74/form-assets/blob/main/Generated%20Image%20September%2010,%202025%20-%2011_16PM.jpg?raw=true",
        "https://github.com/Hewg74/form-assets/blob/8c8751696f95742ffd578e1c3a884f605244a376/Generated%20Image%20September%2010,%202025%20-%2011_19PM.jpg?raw=true",
        "https://github.com/Hewg74/form-assets/blob/8c8751696f95742ffd578e1c3a884f605244a376/Generated%20Image%20September%2010,%202025%20-%2011_20PM.jpg?raw=true"
    ];

    // NEW: Dossier Panel Setup
    const dossierPanel = document.getElementById('dossierPanel');
    const dossierContent = document.getElementById('dossierContent');
    const dossierStatus = document.getElementById('dossierStatus');

    function showStep(step) {
        formSections.forEach((section, index) => {
            const isActive = index + 1 === step;
            section.classList.toggle('active', isActive);
            if (isActive) {
                const firstInput = section.querySelector('input, .custom-select-trigger, textarea');
                if (firstInput) setTimeout(() => firstInput.focus(), 500);
            }
        });
        const progressPercentage = ((step - 1) / (formSections.length - 1)) * 100;
        progressBarFill.style.width = `${progressPercentage}%`;
        progressLabels.forEach(label => {
            label.classList.toggle('active', parseInt(label.dataset.step) === step);
        });

        if (headerIconImg && iconUrls[step - 1]) {
            headerIconImg.style.transition = 'opacity 0.3s ease-in-out';
            headerIconImg.style.opacity = 0;
            setTimeout(() => {
                headerIconImg.src = iconUrls[step - 1];
                headerIconImg.style.opacity = 1;
            }, 300);
        }
    }

    function handleValidation(input) { if (input.checkValidity()) { input.classList.remove('is-invalid'); input.classList.add('is-valid'); } else { input.classList.remove('is-valid'); input.classList.add('is-invalid'); } }
    function setupLiveValidation() { const inputs = form.querySelectorAll('input[required], textarea[required]'); inputs.forEach(input => { input.addEventListener('input', () => handleValidation(input)); input.addEventListener('blur', () => handleValidation(input)); }); }
    function validateStep(step) { let isSectionValid = true; const currentSection = document.getElementById(`section-${step}`); if (!currentSection) return false; const inputs = currentSection.querySelectorAll('input[required], select[required], textarea[required]'); for (let input of inputs) { if (input.tagName === 'SELECT' && input.style.display === 'none') { const customTrigger = input.previousElementSibling.querySelector('.custom-select-trigger'); if (!input.value) { isSectionValid = false; customTrigger.classList.add('is-invalid'); } else { customTrigger.classList.remove('is-invalid'); } } else if (input.type === 'radio') { const radioGroup = document.querySelector(`input[name="${input.name}"]:checked`); if (!radioGroup) { isSectionValid = false; } } else { handleValidation(input); if (!input.checkValidity()) { isSectionValid = false; } } } return isSectionValid; }

    window.nextStep = function() {
        if (validateStep(currentStep) && currentStep < formSections.length) {
            currentStep++;
            showStep(currentStep);
        }
    }

    window.prevStep = function() {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    }

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !(event.target.tagName === 'TEXTAREA')) {
            event.preventDefault();
            const activeSection = document.querySelector('.form-section.active');
            const submitButton = activeSection.querySelector('.submit-button');
            if (submitButton) {
                submitButton.click();
            } else {
                window.nextStep();
            }
        }
    });

    function updateDossier() {
        const formData = new FormData(form);
        let html = '';
        let hasData = false;
        
        const firstName = formData.get('firstName') || '';
        const lastName = formData.get('lastName') || '';
        if (firstName || lastName) {
            html += `<div class="dossier-item"><span class="dossier-label">Target:</span> ${firstName} ${lastName}</div>`;
            hasData = true;
        }

        const position = formData.get('position') || '';
        const company = formData.get('company') || '';
        if (position || company) {
            html += `<div class="dossier-item"><span class="dossier-label">Affiliation:</span> ${position} at ${company}</div>`;
            hasData = true;
        }

        const industrySelect = document.getElementById('industry');
        if (industrySelect && industrySelect.value) {
            const selectedOption = industrySelect.options[industrySelect.selectedIndex].text;
            html += `<div class="dossier-item"><span class="dossier-label">Industry:</span> ${selectedOption.split('-').slice(1).join(' ')}</div>`;
            hasData = true;
        }

        dossierContent.innerHTML = html;
        dossierStatus.textContent = hasData ? "DATA RECEIVED" : "AWAITING INPUT";
    }

    form.addEventListener('input', updateDossier);
    
    // --- V4: FINAL FORM SUBMISSION LOGIC WITH FULL DESCRIPTIONS ---
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            if (!validateStep(currentStep)) return;

            const submitButton = this.querySelector('.submit-button');
            const formFeedback = document.getElementById('form-feedback');
            const webhookUrl = form.action;
            const jsonObject = {};

            // 1. Get all standard text inputs and textareas first
            const formData = new FormData(form);
            formData.forEach((value, key) => {
                if (!form.querySelector(`[name="${key}"]`).type?.includes('checkbox')) {
                    jsonObject[key] = value;
                }
            });

            // 2. Manually get the FULL TEXT for the industry dropdown
            const industrySelect = document.getElementById('industry');
            if (industrySelect && industrySelect.selectedIndex > 0) {
                jsonObject['industry'] = industrySelect.options[industrySelect.selectedIndex].text;
            } else {
                jsonObject['industry'] = "";
            }

            // 3. Manually get FULL TEXT and DESCRIPTION for all CHECKED checkboxes
            const checkboxGroups = {};
            const checkedCheckboxes = form.querySelectorAll('input[type="checkbox"]:checked');
            
            checkedCheckboxes.forEach(checkbox => {
                const name = checkbox.name;
                const choiceItem = checkbox.closest('.choice-item');
                const titleElement = choiceItem.querySelector('.choice-title');
                const descriptionElement = choiceItem.querySelector('.choice-description');
                
                if (titleElement && descriptionElement) {
                    // Combine the title and description text into one string
                    const fullText = `${titleElement.textContent.trim()} - ${descriptionElement.textContent.trim()}`;
                    
                    if (!checkboxGroups[name]) {
                        checkboxGroups[name] = [];
                    }
                    checkboxGroups[name].push(fullText);
                }
            });

            Object.assign(jsonObject, checkboxGroups);

            submitButton.classList.add('is-loading');
            submitButton.disabled = true;
            formFeedback.textContent = '';

            // 4. Send the perfectly formatted JSON object
            fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonObject)
            }).then(response => {
                if (response.ok) {
                    formFeedback.style.color = 'var(--text-color)';
                    formFeedback.textContent = 'Success! Request submitted.';
                    form.reset();
                    document.querySelectorAll('.is-valid, .is-invalid').forEach(el => el.classList.remove('is-valid', 'is-invalid'));
                    const customSelect = document.querySelector('.custom-select-trigger');
                    if (customSelect) customSelect.textContent = 'Select an Industry...';
                    setTimeout(() => {
                        currentStep = 1;
                        showStep(currentStep);
                        formFeedback.textContent = '';
                        updateDossier();
                    }, 2500);
                } else {
                    throw new Error('Network response was not ok. Status: ' + response.statusText);
                }
            }).catch(error => {
                console.error('Submission error:', error);
                formFeedback.style.color = 'var(--error-color)';
                formFeedback.textContent = 'Error: Could not submit the form. Please try again.';
            }).finally(() => {
                submitButton.classList.remove('is-loading');
                submitButton.disabled = false;
            });
        });
    }

    // --- CUSTOM DROPDOWN LOGIC ---
    const originalSelect = document.getElementById('industry'); 
    if (originalSelect) { 
        const wrapper = originalSelect.previousElementSibling; 
        const trigger = wrapper.querySelector('.custom-select-trigger'); 
        const optionsContainer = wrapper.querySelector('.custom-select-options'); 
        
        Array.from(originalSelect.options).forEach((option) => { 
            if (option.value === "" && option.disabled) return; 
            const customOption = document.createElement('div'); 
            customOption.classList.add('custom-select-option'); 
            customOption.textContent = option.textContent; 
            customOption.dataset.value = option.value; 
            optionsContainer.appendChild(customOption); 
        }); 
        
        const customOptions = optionsContainer.querySelectorAll('.custom-select-option'); 
        
        trigger.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            wrapper.classList.toggle('open'); 
            optionsContainer.style.display = wrapper.classList.contains('open') ? 'block' : 'none'; 
        }); 
        
        customOptions.forEach(option => { 
            option.addEventListener('click', function() { 
                trigger.textContent = this.textContent; 
                customOptions.forEach(opt => opt.classList.remove('selected')); 
                this.classList.add('selected'); 
                originalSelect.value = this.dataset.value; 
                trigger.classList.remove('is-invalid'); 
                wrapper.classList.remove('open'); 
                optionsContainer.style.display = 'none'; 
                form.dispatchEvent(new Event('input')); 
            }); 
        }); 
        
        document.addEventListener('click', () => { 
            if (wrapper.classList.contains('open')) { 
                wrapper.classList.remove('open'); 
                optionsContainer.style.display = 'none'; 
            } 
        }); 
    }

    showStep(currentStep);
    setupLiveValidation();
    updateDossier();

    // --- SHADER INITIALIZATION ---
    const canvas = document.getElementById('shader-background'); 
    if (canvas && window.GlslCanvas) { 
        const sandbox = new GlslCanvas(canvas); 
        const fragShader = ` #ifdef GL_ES precision mediump float; #endif uniform float u_time; uniform vec2 u_resolution; vec3 colorA = vec3(0.0); vec3 colorB = vec3(0.1); void main() { vec2 st = gl_FragCoord.xy / u_resolution.xy; st.x *= u_resolution.x / u_resolution.y; vec2 grid = vec2(50.0, 50.0); vec2 pos = st * grid; pos.x += u_time * 0.2; vec2 ipos = floor(pos); vec2 fpos = fract(pos); vec3 color = mix(colorA, colorB, smoothstep(0.98, 1.0, fpos.x) + smoothstep(0.98, 1.0, fpos.y)); gl_FragColor = vec4(color, 1.0); } `; 
        sandbox.load(fragShader); 
        window.addEventListener('resize', () => { 
            sandbox.setUniform('u_resolution', canvas.clientWidth, canvas.clientHeight); 
        }); 
    }
});
