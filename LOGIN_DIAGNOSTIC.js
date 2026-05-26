// 🔍 LOGIN BUTTON DIAGNOSTIC
// Paste this in browser console on Login.html

console.log('=== LOGIN PAGE DIAGNOSTIC ===\n');

// Check 1: Elements exist
console.log('Check 1: Elements Exist');
const loginView = document.getElementById('loginView');
const signupView = document.getElementById('signupView');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const googleBtn = document.getElementById('googleBtn');
const googleBtnSignup = document.getElementById('googleBtnSignup');

console.log('✓ loginView:', !!loginView);
console.log('✓ signupView:', !!signupView);
console.log('✓ showSignup:', !!showSignup);
console.log('✓ showLogin:', !!showLogin);
console.log('✓ googleBtn:', !!googleBtn);
console.log('✓ googleBtnSignup:', !!googleBtnSignup);

// Check 2: Visibility states
console.log('\nCheck 2: Visibility States');
console.log('✓ loginView hidden:', loginView?.classList.contains('hidden'));
console.log('✓ signupView hidden:', signupView?.classList.contains('hidden'));

// Check 3: View switching
console.log('\nCheck 3: Test View Switching');
console.log('Before: loginView hidden =', loginView?.classList.contains('hidden'));
showSignup?.click();
console.log('After showSignup click: loginView hidden =', loginView?.classList.contains('hidden'));
console.log('After showSignup click: signupView hidden =', signupView?.classList.contains('hidden'));

showLogin?.click();
console.log('After showLogin click: loginView hidden =', loginView?.classList.contains('hidden'));
console.log('After showLogin click: signupView hidden =', signupView?.classList.contains('hidden'));

// Check 4: Button visibility in signup
console.log('\nCheck 4: Google Buttons');
console.log('✓ googleBtn display:', getComputedStyle(googleBtn).display);
console.log('✓ googleBtnSignup display:', getComputedStyle(googleBtnSignup).display);
console.log('✓ googleBtn parent display:', getComputedStyle(googleBtn?.parentElement).display);
console.log('✓ googleBtnSignup parent display:', getComputedStyle(googleBtnSignup?.parentElement).display);

console.log('\n=== END DIAGNOSTIC ===');
