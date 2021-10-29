const fastify = require('fastify')({ logger: false})


fastify.register(
  require('sequelize-fastify'),
  {
    instance: 'sequelize',
    sequelizeOptions: require('./config/sequelize'),
  }
)

fastify.register(require('./models/models'))


fastify.register(require('./config/routes'))

fastify.listen(process.env.PORT, '0.0.0.0', function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }

  fastify.log.info(`server listening on ${address}`)
})
