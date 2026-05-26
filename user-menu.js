// StudyHive User Menu
// Owns the header profile dropdown, menu shortcuts, and dark-mode persistence.
(function () {
    const StudyHive = window.StudyHive = window.StudyHive || {};
    const darkModeStorageKey = 'studyhive-dark-mode';

    function getElements() {
        return {
            profileToggle: document.getElementById('profileToggle'),
            profileMenu: document.getElementById('profileMenu'),
            settingsDarkModeSwitch: document.getElementById('settingsDarkModeSwitch'),
            sectionShortcutButtons: document.querySelectorAll('[data-open-section]')
        };
    }

    function closeProfileMenu() {
        const { profileMenu } = getElements();
        if (profileMenu) {
            profileMenu.classList.remove('open');
        }
    }

    function setDarkMode(active, persist = true) {
        const { settingsDarkModeSwitch } = getElements();

        document.body.classList.toggle('dark-mode', active);

        if (settingsDarkModeSwitch) {
            settingsDarkModeSwitch.setAttribute('aria-pressed', String(active));
        }

        if (persist) {
            localStorage.setItem(darkModeStorageKey, active ? 'on' : 'off');
        }
    }

    function initDarkMode() {
        const savedDarkMode = localStorage.getItem(darkModeStorageKey);
        setDarkMode(savedDarkMode === 'on', false);
    }

    function initSectionShortcuts() {
        const { sectionShortcutButtons } = getElements();

        sectionShortcutButtons.forEach((button) => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                StudyHive.showDashboardSection(button.dataset.openSection);
                closeProfileMenu();
            });
        });
    }

    function initProfileMenuItems() {
        const profileMenu = document.getElementById('profileMenu');
        if (!profileMenu) return;

        const menuItems = profileMenu.querySelectorAll('.profile-menu-item:not(.profile-menu-logout)');

        menuItems.forEach((item, index) => {
            item.addEventListener('click', (event) => {
                event.stopPropagation();
                const sections = ['profile', 'settings', 'help', 'report'];
                if (index < sections.length) {
                    StudyHive.showDashboardSection(sections[index]);
                }
                closeProfileMenu();
            });
        });
    }

    function initUserMenu() {
        const { profileToggle } = getElements();
        if (!profileToggle) return;

        initDarkMode();
        initSectionShortcuts();
        initProfileMenuItems();

        profileToggle.addEventListener('click', (event) => {
            if (event.target.closest('.profile-menu')) return;
            event.stopPropagation();
            getElements().profileMenu.classList.toggle('open');
        });

        document.addEventListener('click', (event) => {
            if (!profileToggle.contains(event.target)) {
                closeProfileMenu();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeProfileMenu();
            }
        });

    }

    StudyHive.closeProfileMenu = closeProfileMenu;
    StudyHive.setDarkMode = setDarkMode;
    StudyHive.initUserMenu = initUserMenu;
})();
