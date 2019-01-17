require('debugs/init')

const debug = require('debug')('lemon:google-cloud-pubsub')
const {PubSub} = require('@google-cloud/pubsub')

async function main() {
  try {
    const pubsub = new PubSub({
      projectId: 'dwebtoken',
      keyFilename: './temp/dwebtoken-ffbe0092d50b.json',
    })
    
    // const [topic] = await pubsub.createTopic('test')
    // debug('created:', topic.name)

    const subscription = pubsub.subscription('aaa')
    // subscription.on('message', message => {
    //   debug('>received', message.id, message.data.toString(), message.attributes)
    //   message.ack()
    // })
    subscription.setMetadata({
      ackDeadlineSeconds: 15,
    })
  } catch (error) {
    debug(error)
  }
}
main()