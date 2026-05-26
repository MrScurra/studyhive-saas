// StudyHive Sidebar
// Owns left-sidebar section navigation only.
(function () {
    const StudyHive = window.StudyHive = window.StudyHive || {};

    function initSidebarNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-section]');

        navItems.forEach((item) => {
            const openSection = () => StudyHive.showDashboardSection(item.dataset.section);

            item.addEventListener('click', openSection);
            item.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openSection();
                }
            });
        });
    }

    StudyHive.initSidebarNavigation = initSidebarNavigation;
})();
