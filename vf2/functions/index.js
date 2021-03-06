const functions = require("firebase-functions");
const admin = require("firebase-admin")
const serviceAccount = require("./key.json");
const { plural } = require("pluralize");
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

exports.onCreateBoardArticle = functions.region(region).firestore.document('boards/{bid}/articles/{aid}').onCreate(async(snap, context) => {
  const set = {
    count: admin.firestore.FieldValue.increment(1)
  }
  const doc = snap.data()
  if (doc.category) set.categories = admin.firestore.FieldValue.arrayUnion(doc.category)
  if (doc.tags.length) set.tags = admin.firestore.FieldValue.arrayUnion(...doc.tags)
  try {
    await fdb.collection('boards').doc(context.params.bid).update(set)
  } catch (e) {
    console.error('board info update err: ' + e.message)
  }

  if (doc.images.length) {
    const ids = []
    const thumbIds = []
    doc.images.forEach(image => {
      ids.push(image.id)
      thumbIds.push(image.thumbId)
    })
  }
  try {
    const batch = fdb.batch()
    const sn = await fdb.collection('tempFiles').where('id', 'in', ids).get()
    sn.docs.forEach(doc => batch.delete(doc.ref))
    const snt = await fdb.collection('tempFiles').where('id', 'in', thumbIds).get()
    snt.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
  } catch (e) {
    console.error('tempFiles remove err: ' + e.message)
  }

  await removeOldTempFiles()
})

exports.onUpdateBoardArticle = functions.region(region).firestore.document('boards/{bid}/articles/{aid}').onUpdate(async (change,context) => {
  const isEqual = require('lodash').isEqual
  const set = {}
  const beforeDoc = change.before.data()
  const doc = change.after.data()
  if (doc.category && doc.category != beforeDoc.category) set.categories = admin.firestore.FieldValue.arrayUnion(doc.category)
  if (doc.tags.length && isEqual(beforeDoc.tags, doc.tags)) set.tags = admin.firestore.FieldValue.arrayUnion(...doc.tags)
  if (Object.keys(set).length) await fdb.collection('boards').doc(context.params.bid).update(set)

  const deleteImages = beforeDoc.images.filter(before => {
    return !doc.images.some(after => before.id === after.id)
  })

  const imgs = []
  imgs.push('images')
  imgs.push('boards')
  imgs.push(context.params.bid)
  imgs.push(context.params.aid)
  const p = imgs.join('/') + '/'
  for (const image of deleteImages) {
    await admin.storage().bucket().file(p + image.id).delete().catch(e => console.error('storage deleteImages remove err: ' + e.message))
    await admin.storage().bucket().file(p + image.thumbId).delete().catch(e => console.error('storage remove err: ' + e.message))
  }

  const ids = []
  const thumbIds = []
  doc.images.forEach(image => {
    ids.push(image.id)
    thumbIds.push(image.thumbId)
  })
  try {
    const batch = fdb.batch()
    const sn = await fdb.collection('tempFiles').where('id', 'in', ids).get()
    sn.docs.forEach(doc => batch.delete(doc.ref))
    const snt = await fdb.collection('tempFiles').where('id', 'in', thumbIds).get()
    snt.docs.forEach(doc => batch.delete(doc.ref))
  } catch (e) {
    console.error('tempFiles remove err: ' + e.message)
  }
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

  await admin.storage().bucket().file(ps.join('/')).delete().catch(e => console.error('storage remove err: ' + e.message))

  const images = []
  images.push('images')
  images.push('boards')
  images.push(context.params.bid)
  images.push(context.params.aid)
  return admin.storage().bucket().deleteFiles({ prefix: images.join('/') })
})

exports.saveTempFiles = functions.region(region).storage.object().onFinalize(async (object) => {
  const last = require('lodash').last
  const name = object.name
  if (last(name.split('.')) === 'md') return
  const createdAt = new Date()
  const id = createdAt.getTime().toString()
  const set = {
    name,
    contentType: object.contentType,
    size: object.size,
    crc32c: object.crc32c,
    createdAt,
    id: last(name.split('/'))
  }
  await fdb.collection('tempFiles').doc(id).set(set)
})


exports.onCreateBoardComment = functions.region(region).firestore.document('boards/{bid}/articles/{aid}/comments/{cid}').onCreate((snap, context) => {
  return fdb.collection('boards').doc(context.params.bid).collection('articles').doc(context.params.aid).update({ commentCount: admin.firestore.FieldValue.increment(1) })
})

exports.onDeleteBoardComment = functions.region(region).firestore.document('boards/{bid}/articles/{aid}/comments/{cid}').onDelete((snap, context) => {
  return fdb.collection('boards').doc(context.params.bid).collection('articles').doc(context.params.aid).update({ commentCount: admin.firestore.FieldValue.increment(-1)})
})

const removeOldTempFiles = async () => {
  const moment = require('moment')
  const sn = await fdb.collection('tempFiles').where('createdAt', '<', moment().subtract(1, 'minutes').toDate()).orderBy('createdAt').limit(5).get()
  if (sn.empty) return
  const batch = fdb.batch()
  for (const doc of sn.docs) {
    const file = doc.data()
    await admin.storage().bucket().file(file.name).delete().catch(e => console.error('tempFile remove err: ' + e.message))
    batch.delete(doc.ref)
  }
  await batch.commit()
}

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

exports.seo = functions.https.onRequest(async (req,res) => {
  const { parse } = require('node-html-parser')
  const fs = require('fs')
  const pluralize = require('pluralize')
  const html = fs.readFileSync('index.html').toString()
  const root = parse(html)
  
  const ps = req.path.split('/')
  ps.shift()
  ps.forEach((v, i) => console.log(i, v))
  if (ps.length !== 3) return res.send(html)
  const mainCollection = pluralize(ps.shift())
  const board = ps.shift()
  const article = ps.shift()

  const doc = await fdb.collection(mainCollection).doc(board).collection('articles').doc(article).get()

  if (!doc.exists) return res.send(html)
  const item = doc.data()

  const child = root.lastChild.childNodes[0]
  const title = child.childNodes[0]
  const description = child.childNodes[1]
  const ogTitle = child.childNodes[2]
  const ogDescription = child.childNodes[3]
  const ogImage = child.childNodes[4]

  title.set_content(item.title)
  description.setAttribute('content', item.summary.substr(0, 80))
  ogTitle.setAttribute('content', item.title)
  ogDescription.setAttribute('content', item.summary.substr(0, 80))
  ogImage.setAttribute('content', item.images.length ? item.images[0].thumbUrl : '/logo.png')
  res.status(200).send(root.toString())
})
