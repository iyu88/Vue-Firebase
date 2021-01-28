const functions = require("firebase-functions");
const admin = require("firebase-admin")
const serviceAccount = require("./key.json")
const region = functions.config().admin.region || 'us-central1'

// var admin = require("firebase-admin");

// var serviceAccount = require("./key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: functions.config().admin.db_url, //"https://vjs-fb-default-rtdb.firebaseio.com"
  storageBucket: functions.config().admin.bucket_url
});

const db = admin.database()
const fdb = admin.firestore()

exports.createUser = functions.region(region).auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user
  const time = new Date()
  const u = {
    email,
    displayName,
    photoURL,
    createdAt: time,
    level: email === functions.config().admin.email ? 0 : 5,
    visitedAt: time,
    visitCount: 0
  }
  await fdb.collection('users').doc(uid).set(u)
  u.createdAt = time.getTime()
  await db.ref('users').child(uid).set(u)
  try { 
    await db.collection('meta').doc('users').update({ count: admin.firestore.FieldValue.increment(1) })
  } catch (e) {
    await db.collection('meta').doc('users').set({ count: 1 })
  }
})

exports.deleteUser = functions.region(region).auth.user().onDelete(async (user) => {
  const { uid } = user
  await db.ref('users').child(uid).remove()
  await fdb.collection('users').doc(uid).delete()
  await fdb.collection('meta').doc('users').update({ count: admin.firestore.FieldValue.increment(-1) })
})

exports.onCreateBoard = functions.region(region).firestore.document('boards/{bid}').onCreate(async(snap, context) => {
  try {
    await fdb.collection('meta').doc('boards').update({ count: admin.firestore.FieldValue.increment(1)})
  } catch (e) {
    await fdb.collection('meta').doc('boards').set({ count: 1 })
  }
})

exports.onDeleteBoard = functions.region(region).firestore.document('borads/{bid}').onDelete(async(snap, context) => {
  await fdb.collection('meta').doc('boards').update({ count: admin.firestore.FieldValue.increment(-1) })
  const batch = fdb.batch()
  const sn = await fdb.collection('boards').doc(context.params.bid).collection('articles').get()
  sn.docs.forEach(doc => batch.delete(doc.ref))
  await batch.commit()
})

exports.onCreateBoardArticle = functions.region(region).firestore.document('boards/{bid}/articles/{aid}').onCreate((snap, context) => {
  return fdb.collection('boards').doc(context.params.bid).update({ count: admin.firestore.FieldValue.increment(1) })
})

exports.onDeleteBoardArticle = functions.region(region).firestore.document('boards/{bid}/articles/{aid}').onDelete(async (snap, context) => {
  await fdb.collection('boards').doc(context.params.bid).update({ count: admin.firestore.FieldValue.increment(-1) }).catch(e => console.error('boards update err: ' + e.message))
  try {
    // remove comment
    const batch = fdb.batch()
    const sn = await fdb.collection('boards').doc(context.params.bid).collection('articles').doc(context.params.aid).collection('comments').get()
    sn.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
  } catch (e) {
    console.error('comment remove err: ' + e.message)
  }

  // remove storage
  const ps = []
  ps.push('boards')
  ps.push(context.params.bid)
  ps.push(context.params.aid + '-' + snap.data().uid + ".md")

  await admin.storage().bucket().file(ps.join('/')).delete().catch(e => console.error('storage remove err + ' + e.message))
})

exports.onCreateBoardComment = functions.region(region).firestore.document('boards/{bid}/articles/{aid}/comments/{cid}').onCreate((snap, context) => {
  return fdb.collection('boards').doc(context.params.bid).collection('articles').doc(context.params.aid).update({ commentCount: admin.firestore.FieldValue.increment(1) })
})

exports.onDeleteBoardComment = functions.region(region).firestore.document('boards/{bid}/articles/{aid}/comments/{cid}').onDelete((snap, context) => {
  return fdb.collection('boards').doc(context.params.bid).collection('articles').doc(context.params.aid).update({ commentCount: admin.firestore.FieldValue.increment(-1)})
})

/*
exports.incrementBoardCount = functions.firestore.document('boards/{bid}').onCreate(async(snap, context) => {
  try {
    await fdb.collection('meta').doc('boards').update('count', admin.firestore.FieldValue.increment(1))
  } catch (e) {
    await fdb.collection('meta').doc('boards').set({ count: 1 })
  }
}) 

exports.decrementBoardCount = functions.firestore.document('boards/{bid}').onDelete(async(snap, context) => {
  await fdb.collection('meta').doc('boards').update('count', admin.firestore.FieldValue.increment(-1))
})
*/
