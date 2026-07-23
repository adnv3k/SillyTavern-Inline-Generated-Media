const EXTENSION_ID = 'inline-generated-media';
const HOST_CLASS = 'igm-inline-host';
const CLONE_CLASS = 'igm-inline-clone';
const NATIVE_CLASS = 'igm-native-wrapper';

let initialized = false;
let observer = null;
let scheduled = false;

function isHTMLElement(node) {
    return node instanceof HTMLElement;
}

function getText(message) {
    const text = message.querySelector('.mes_text');
    return isHTMLElement(text) ? text : null;
}

function getNativeWrapper(message) {
    const wrappers = Array.from(message.querySelectorAll('.mes_media_wrapper'));
    const wrapper = wrappers.find((element) => {
        return isHTMLElement(element) && !element.closest(`.${HOST_CLASS}`);
    });
    return isHTMLElement(wrapper) ? wrapper : null;
}

function isEditing(message) {
    return Boolean(
        message.querySelector(
            '.edit_textarea, .mes_edit_textarea, .mes_text textarea, .mes_text[contenteditable="true"]'
        )
    );
}

function removeClone(message) {
    message.querySelector(`.${HOST_CLASS}`)?.remove();
    getText(message)?.classList.remove('has-inline-generated-media');
    // Bring the real media wrapper back on-screen; otherwise it stays pinned
    // off-canvas by .igm-native-wrapper and the message shows no image at all
    // (e.g. while editing).
    message
        .querySelectorAll(`.${NATIVE_CLASS}`)
        .forEach((wrapper) => wrapper.classList.remove(NATIVE_CLASS));
}

function copyRuntimeState(source, clone) {
    const sourceImages = source.querySelectorAll('img');
    const cloneImages = clone.querySelectorAll('img');

    sourceImages.forEach((sourceImage, index) => {
        const cloneImage = cloneImages[index];
        if (!(cloneImage instanceof HTMLImageElement)) return;

        cloneImage.src = sourceImage.currentSrc || sourceImage.src;
        cloneImage.srcset = sourceImage.srcset;
        cloneImage.title = sourceImage.title;
        cloneImage.alt = sourceImage.alt;
    });

    const sourceCounters = source.querySelectorAll('.mes_img_swipe_counter');
    const cloneCounters = clone.querySelectorAll('.mes_img_swipe_counter');

    sourceCounters.forEach((counter, index) => {
        if (cloneCounters[index]) {
            cloneCounters[index].textContent = counter.textContent;
        }
    });
}

function renderClone(message, nativeWrapper) {
    const text = getText(message);
    const nativeContainer = nativeWrapper.querySelector('.mes_media_container');

    if (!text || !isHTMLElement(nativeContainer)) {
        removeClone(message);
        return;
    }

    let host = text.querySelector(`:scope > .${HOST_CLASS}`);
    let clone = host?.querySelector(`:scope > .${CLONE_CLASS}`);

    const sourceSignature = [
        nativeContainer.getAttribute('data-index') || '',
        nativeContainer.querySelector('.mes_img')?.getAttribute('src') || '',
        nativeContainer.querySelector('.mes_img')?.getAttribute('title') || '',
        nativeContainer.querySelector('.mes_img_swipe_counter')?.textContent || '',
    ].join('|');

    if (
        !isHTMLElement(host) ||
        !isHTMLElement(clone) ||
        host.dataset.sourceSignature !== sourceSignature
    ) {
        host?.remove();

        host = document.createElement('div');
        host.className = HOST_CLASS;
        host.dataset.sourceSignature = sourceSignature;

        clone = nativeContainer.cloneNode(true);
        if (!isHTMLElement(clone)) return;

        clone.classList.add(CLONE_CLASS);
        clone.removeAttribute('id');
        clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));

        copyRuntimeState(nativeContainer, clone);
        host.appendChild(clone);
        text.appendChild(host);
    } else {
        copyRuntimeState(nativeContainer, clone);
    }

    nativeWrapper.classList.add(NATIVE_CLASS);
    text.classList.add('has-inline-generated-media');
}

function processMessage(message) {
    if (isEditing(message)) {
        removeClone(message);
        return;
    }

    const nativeWrapper = getNativeWrapper(message);

    if (!nativeWrapper?.querySelector('.mes_media_container .mes_img')) {
        removeClone(message);
        return;
    }

    renderClone(message, nativeWrapper);
}

function processMessages() {
    for (const message of document.querySelectorAll('.mes')) {
        if (isHTMLElement(message)) {
            processMessage(message);
        }
    }
}

function scheduleProcess(delay = 0) {
    if (scheduled) return;

    scheduled = true;
    setTimeout(() => {
        requestAnimationFrame(() => {
            scheduled = false;
            processMessages();
        });
    }, delay);
}

function findNativeTarget(cloneTarget, nativeWrapper) {
    const selectors = [
        '.mes_media_enlarge',
        '.mes_img_caption',
        '.mes_media_delete',
        '.mes_img_swipe_left',
        '.mes_img_swipe_right',
        '.mes_img',
    ];

    for (const selector of selectors) {
        if (cloneTarget.matches(selector) || cloneTarget.closest(selector)) {
            const target = nativeWrapper.querySelector(selector);
            return isHTMLElement(target) ? target : null;
        }
    }

    return null;
}

function handleCloneClick(event) {
    if (!(event.target instanceof Element)) return;

    const host = event.target.closest(`.${HOST_CLASS}`);
    if (!isHTMLElement(host)) return;

    const message = host.closest('.mes');
    if (!isHTMLElement(message)) return;

    const nativeWrapper = getNativeWrapper(message);
    if (!nativeWrapper) return;

    const cloneTarget = event.target.closest(
        '.mes_media_enlarge, .mes_img_caption, .mes_media_delete, .mes_img_swipe_left, .mes_img_swipe_right, .mes_img'
    );

    if (!isHTMLElement(cloneTarget)) return;

    const nativeTarget = findNativeTarget(cloneTarget, nativeWrapper);
    if (!nativeTarget) return;

    event.preventDefault();
    event.stopPropagation();

    nativeTarget.click();

    scheduleProcess(150);
    setTimeout(() => scheduleProcess(500), 500);
    setTimeout(() => scheduleProcess(1500), 1500);
}

function prepareForEdit(event) {
    if (!(event.target instanceof Element)) return;

    const edit = event.target.closest(
        '.mes_edit, .mes_edit_button, [title="Edit"], [aria-label="Edit"]'
    );

    const message = edit?.closest('.mes');
    if (isHTMLElement(message)) {
        removeClone(message);
    }
}

function handleMediaLoad(event) {
    if (event.target instanceof HTMLImageElement) {
        scheduleProcess();
    }
}

export function init() {
    if (initialized) return;
    initialized = true;

    document.addEventListener('click', handleCloneClick, true);
    document.addEventListener('pointerdown', prepareForEdit, true);
    document.addEventListener('load', handleMediaLoad, true);

    observer = new MutationObserver((mutations) => {
        const meaningful = mutations.some((mutation) => {
            const target = mutation.target;
            return !(target instanceof Element && target.closest(`.${HOST_CLASS}`));
        });

        if (meaningful) scheduleProcess();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'title', 'class', 'data-index'],
    });

    processMessages();
    console.info(`[${EXTENSION_ID}] v1.0.0 initialized.`);
}

// SillyTavern loads a third-party extension by importing this module; it does
// not call any exported entry point, so bootstrap init() ourselves once the
// DOM is ready.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(), { once: true });
} else {
    init();
}
