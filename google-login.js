// 교사 구글 로그인 (gwangsu-on Firebase — 26-2status·sr-exhibition과 같은 설정). ES module.
// window.GLOGIN.login() → 로그인 창, window.GLOGIN.logout(), window.GLOGIN.onUser(cb(email)) 로그인될 때마다 호출
// 교사 확인: window.GLOGIN.teacherOf(email) → { key, name, sub } | null  (help-teachers.js 명단과 대조)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp({
  apiKey: "AIzaSyB_D2Wi944YQL-1rCdgeNU-tD8lpMek_wM",
  authDomain: "gwangsu-on.firebaseapp.com",
  databaseURL: "https://gwangsu-on-default-rtdb.firebaseio.com",
  projectId: "gwangsu-on",
  storageBucket: "gwangsu-on.firebasestorage.app",
  messagingSenderId: "684885628658",
  appId: "1:684885628658:web:b471726b604754a82b626b",
}, 'last26-teacher');
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" }); // 크롬북에 계정이 여러 개여도 학교 계정을 고를 수 있게

const sha = async s => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s).trim().toLowerCase()))))
  .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 20);
const subs = [];
window.GLOGIN = {
  async login() {
    try { await signInWithPopup(auth, provider); return true; }
    catch (err) {
      const c = err && err.code;
      if (c === "auth/popup-blocked" || c === "auth/cancelled-popup-request" || c === "auth/operation-not-supported-in-this-environment") {
        try { await signInWithRedirect(auth, provider); return true; } catch (e2) {}
      }
      return false;
    }
  },
  logout() { return signOut(auth); },
  onUser(cb) { subs.push(cb); if (auth.currentUser) cb(String(auth.currentUser.email || '').toLowerCase()); },
  async teacherOf(email) {
    let h = await sha(email); h = (window.HELP_ALIAS || {})[h] || h;
    const t = (window.HELP_TEACHERS || {})[h];
    return t ? { key: h, name: t[0], sub: t[1] } : null;
  },
};
getRedirectResult(auth).catch(() => {});
onAuthStateChanged(auth, user => { if (user) subs.forEach(cb => cb(String(user.email || '').toLowerCase())); });
window.dispatchEvent(new Event('glogin-ready'));
