(function () {
  const localApiBaseUrl = 'http://localhost:5000/api';
  const productionApiBaseUrl = 'https://studyhive-saas.onrender.com/api';
  const existingConfig = window.StudyHiveConfig || {};
  const configuredApiBaseUrl = existingConfig.apiBaseUrl || existingConfig.API_BASE_URL || '';
  const hostname = window.location.hostname;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
  const apiBaseUrl = (configuredApiBaseUrl || (isLocalHost ? localApiBaseUrl : productionApiBaseUrl)).replace(/\/$/, '');

  window.StudyHiveConfig = {
    ...existingConfig,
    apiBaseUrl,
    isLocalHost
  };
})();
