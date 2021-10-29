const fastify = require('fastify')({ logger: false})
const ValidationError = require('./src/ValidationError')

Object.defineProperty(Array.prototype, 'indexBy', {
  value: function (field) {
    let map = {};
    for (let el of this) {
      if (el !== undefined && el !== null) {
        let fieldValue = (typeof(field) === 'function' ? field(el) : el[field]);
        map[fieldValue] = el;
      }
    }

    return map;
  }
});

Object.defineProperty(Date.prototype, 'getYmd', {
  value: function () {
    return this.getFullYear()
      + '-' + ((this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1))
      + '-' + (this.getDate() < 10 ? '0' + this.getDate() : this.getDate());
  }
});

fastify.register(
  require('sequelize-fastify'),
  {
    instance: 'sequelize',
    sequelizeOptions: require('./config/sequelize'),
  }
)

fastify.register(require('./models/models'))


fastify.register(require('./config/routes'))

fastify.setErrorHandler(function (error, request, reply) {
  if (error instanceof ValidationError) {
    reply.status(400).send({error: error.message});
  } else {
    if (! (error.parent && error.parent.code === 'ER_SIGNAL_EXCEPTION' || error.code === 'ER_SIGNAL_EXCEPTION')) {
      console.log(error);
    }

    reply.status(500).send({error: 'Internal server error'});
  }
})

fastify.listen(process.env.PORT, '0.0.0.0', function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }

  fastify.log.info(`server listening on ${address}`)
})
