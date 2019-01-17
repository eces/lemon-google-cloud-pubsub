const debug = require('debug')('lemon:google-cloud-pubsub')
const debugEmit = require('debug')('lemon:emit')
const debugOn = require('debug')('lemon:on')

const {PubSub} = require('@google-cloud/pubsub')
const TOPIC_PREFIX = 'lemon.'
const SUBSCRIPTION_PREFIX = 'lemon.sub.'

const GoogleCloudPubSub = (_options) => {
  const options = Object.assign({
    ns: 'lemon',
  }, _options)

  return (that) => {
    const pubsub = new PubSub(options)
    const listening_table = {}

    that.pubsub = pubsub
    that.has_backend = true
    that.on('purge', async channel_name => {
      debug(`events purged on ${that.cname(channel_name)}`)
      const topic_name = channel_name
      const topic = that.pubsub.topic(LEMON_PREFIX+topic_name)
      try {
        await topic.delete() 
      } catch (error) {
        that.emit('error', error)
      }
    })

    that.on('ack', ({channel_name, id}) => {
      debug(`events ack on ${that.cname(channel_name)}`)
      that.pubsub
        .subscription(SUBSCRIPTION_PREFIX+channel_name)
        .ack_({
          ackId: id,
        })
    })
    
    const promised_queue = (channel_name, opt = {}, callback) => {
      that.pubsub.createTopic(TOPIC_PREFIX+channel_name, (err) => {
        // if (err) {
        //   if (String(err.message).includes('ALREADY_EXISTS')) {
        //     return callback()
        //   }
        // }
        that.pubsub.topic(TOPIC_PREFIX+channel_name)
          .createSubscription(SUBSCRIPTION_PREFIX+channel_name, (err, r) => {
          // if (err) {
          //   if (String(err.message).includes('ALREADY_EXISTS')) {
              
          //   }
          //   return that.emit('error', err)
          // }
          debug(111)
          that.pubsub
            .topic(TOPIC_PREFIX+channel_name)
            .subscription(SUBSCRIPTION_PREFIX+channel_name)
            .setMetadata({
              ackDeadlineSeconds: (opt.vt / 1000) || options.vt,
            }, (err) => {
              debug(222)
              if (err) {
                return that.emit('error', err)
              }
              debugOn(`queue created ${that.cname(channel_name)}`)
              // set queue attributes
              callback()
            })
        })
      })
    }

    that.on('listen', ({channel_name}, opt) => {
      if (listening_table[channel_name]) {
        return
      }

      promised_queue(channel_name, opt, () => {
        const _channel_name = channel_name
        debugOn(`events listening on ${options.ns}:rt:${_channel_name}`)
        const topic = that.pubsub.topic(TOPIC_PREFIX+_channel_name)
        const subscription = topic.subscription(SUBSCRIPTION_PREFIX+channel_name)
        subscription.on('message', message => {
          const [event_name, encoded] = JSON.parse(message.data)
          const json = JSON.parse(encoded)
          that.emit('message', {
            // id: message.id,
            id: message.ackId,
            channel_name: _channel_name,
            event_name,
            json,
            ack: message.ack,
          }, () => {
            debug('listen -> onmessage')
          })
        })
      })
    })

    that.on('enqueue', ({channel_name, event_name, json}, opt) => {
      const message = JSON.stringify([event_name, json])
      // promised_queue(channel_name, {}, () => {
      // })
      const topic = that.pubsub.topic(TOPIC_PREFIX+channel_name)
      const publisher = topic.publisher()
      publisher.publish(Buffer.from(message), (err, r) => {
        if (err) {
          return that.emit('error', err)
        }
      })
    })

    that.emit('backend connected')
  }
}

module.exports = GoogleCloudPubSub