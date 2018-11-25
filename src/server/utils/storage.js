/**
 * Try to connect to a redis instance. If this failes, create a
 * redis-mock instance for local development.
 *
 * @returns {RedisClient}
 */
export default function getRedisClient () {
  return new Promise(async (resolve, reject) => {
    const url = process.env.REDIS_URL || '//localhost:6379'

    const redis = require('redis')
    const client = redis.createClient(url)

    client.on('ready', function () {
      console.log('Connected to Redis at ' + url)
      resolve(client)
    })

    client.on('error', function () {
      this.quit()
      console.log('Using redis-mock for local development.')

      var redisMock = require('redis-mock')
      var client = redisMock.createClient()

      resolve(client)
    })
  })
}
