(function() {
  const cfg = {
    apiKey: "AIzaSyBJLk_6WTTUyLKhRGheqUrcDuWDeNL4F6U",
    authDomain: "data-viz-lib.firebaseapp.com",
    projectId: "data-viz-lib",
    storageBucket: "data-viz-lib.firebasestorage.app",
    messagingSenderId: "282022303172",
    appId: "1:282022303172:web:581e33a67617a2daaec091",
  };
  if (!firebase.apps.length) firebase.initializeApp(cfg);

  const _auth = firebase.auth();
  const _db   = firebase.firestore();
  const _gp   = new firebase.auth.GoogleAuthProvider();

  window.fbAuth    = _auth;
  window.fbSignIn  = () => _auth.signInWithPopup(_gp);
  window.fbSignOut = () => _auth.signOut();

  window.fbSaveChart = async function(doc) {
    const user = _auth.currentUser;
    if (!user) throw new Error('Not signed in');
    return _db.collection('users').doc(user.uid).collection('charts')
      .add({ ...doc, createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  };

  window.fbUpdateChart = async function(docId, patch) {
    const user = _auth.currentUser;
    if (!user) throw new Error('Not signed in');
    return _db.collection('users').doc(user.uid).collection('charts').doc(docId)
      .update({ ...patch, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  };

  window.fbGetChart = async function(docId) {
    const user = _auth.currentUser;
    if (!user) return null;
    const snap = await _db.collection('users').doc(user.uid).collection('charts').doc(docId).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  };

  window.fbGetUserCharts = async function() {
    const user = _auth.currentUser;
    if (!user) return [];
    const snap = await _db.collection('users').doc(user.uid).collection('charts')
      .orderBy('updatedAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  window.fbDeleteChart = async function(docId) {
    const user = _auth.currentUser;
    if (!user) throw new Error('Not signed in');
    return _db.collection('users').doc(user.uid).collection('charts').doc(docId).delete();
  };
})();
