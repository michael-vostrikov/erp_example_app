'use strict';

const DocumentService = require('../src/service/DocumentService');
const { randomInt, runInTransaction, executeWithRetry } = require('../src/functions');
const { documents_count } = require('../src/constants');


async function routes (fastify, options) {
  let sequelize = fastify.sequelize;

  const { Document } = sequelize.models;
  let documentService = new DocumentService(sequelize);

  await documentService.init();


  const closeDocSchema = {
    querystring: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { oneOf: [
            { type: 'string', enum: ['random'] },
            { type: 'integer' },
          ] },
        closing_type: { type: 'integer', enum: [-1, 1] },
      }
    }
  };

  fastify.get('/api/close_doc', { schema: closeDocSchema }, async (request, reply) => {
    return await runInTransaction(sequelize, async function () {
      let id = request.query.id;
      let closingType = request.query.closing_type;

      if (id === 'random') {
        // берем чуть больше, чем есть документов, чтобы иногда происходила ошибка 404
        // берем документы не во всем диапазоне, чтобы чаще случались дедлоки
        id = randomInt(documents_count * 0.99, documents_count * 1.001);
      }

      let document = await Document.findOne({
        where: { id: id },
        lock: true,
      });
      if (document === null) {
        return reply.code(404).send({error: 'Document not found'});
      }

      if (closingType === undefined) {
        closingType = (document.closed === true ? -1 : 1);
      }

      await documentService.closeDoc(document, closingType);

      return reply.send({ success: true });
    });
  });
}

module.exports = routes
