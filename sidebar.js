// StudyHive Sidebar
// Owns left-sidebar section navigation only.
(function () {
    const StudyHive = window.StudyHive = window.StudyHive || {};

    function openDashboardSection(sectionName) {
        if (typeof StudyHive.showDashboardSection === 'function') {
            StudyHive.showDashboardSection(sectionName);
        }
    }

    function initSidebarNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-section]');
        const sectionTriggers = document.querySelectorAll('[data-nav-section]');

        navItems.forEach((item) => {
            const openSection = () => openDashboardSection(item.dataset.section);

            item.addEventListener('click', openSection);
            item.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openSection();
                }
            });
        });

        sectionTriggers.forEach((trigger) => {
            if (trigger.dataset.navReady === 'true') return;

            trigger.dataset.navReady = 'true';
            trigger.addEventListener('click', () => openDashboardSection(trigger.dataset.navSection));
        });
    }

    StudyHive.openDashboardSection = openDashboardSection;
    StudyHive.initSidebarNavigation = initSidebarNavigation;
})();
