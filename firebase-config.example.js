(function() {
  const cfg = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
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
