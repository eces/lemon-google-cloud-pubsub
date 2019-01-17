require('debugs/init')

const debug = require('debug')('lemon:test')
const Lemon = require('lemongrass')
const LemonGoogleCloudPubSub = require('../index.js')

const api = new Lemon({
  vt: 3,
  delay: 1,
})
api.use(LemonGoogleCloudPubSub({
  projectId: 'dwebtoken',
  keyFilename: './temp/dwebtoken-ffbe0092d50b.json',
}))
api.on('error', error => {
  debug(error)
})

// api.purge('@user')

api.subscribe('@user balance updated', (message, done) => {
  debug('@user balance updated: ', message)
  // done()
}, {
  vt: '15s',
})
api.subscribe('@block created', (message, done) => {
  debug('block created ', message)
  // done()
}, {
  vt: '10s',
})

// api.publish('@user balance updated', {
//   action: 'locked at ' + new Date,
// })
// api.publish('@block created', {
//   no: 30000,
// })
// api.publish('@user balance updated', {
//   action: 'locked at ' + new Date,
// })
