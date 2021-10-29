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


  const getMaterialsSchema = {
    querystring: {
      type: 'object',
      required: ['document_id'],
      properties: {
        document_id: { oneOf: [
            { type: 'string', enum: ['random'] },
            { type: 'integer' },
          ] },
        term: { type: 'string' },
        limit_stock: { type: 'integer', enum: [0, 1] },
        offset: { type: 'integer', minimum: 0 },
      }
    }
  };

  fastify.get('/api/materials_price_current_stock', { schema: getMaterialsSchema }, async (request, reply) => {
    let id = request.query.document_id;
    let term = request.query.term;
    let limitStock = request.query.limit_stock;
    let offset = request.query.offset;

    if (id === 'random') {
      // use maximum that is more than exists in database to trigger 404 sometimes
      id = randomInt(1, documents_count * 1.01);

      if (!term) {
        term = '';
        let testStr = 'Товар1234567890 asdf';
        if (Math.random() < 0.5) {
          term = testStr.charAt(randomInt(0, testStr.length - 1));
        }
      }

      if (!limitStock) {
        limitStock = randomInt(0, 1);
      }

      if (!offset) {
        offset = 0;
      }
    } else {
      term = term ?? '';
      limitStock = parseInt(limitStock ?? 0);
      offset = parseInt(offset ?? 0);
    }

    let limit = 100;

    let document = await Document.findOne({ where: { id: id } });
    if (document === null) {
      return reply.code(404).send({error: 'Document not found'});
    }

    let list = await documentService.getMaterialsPriceCurrentStock(document, term, limitStock, offset, limit);

    return reply.send({ data: list });
  });


  fastify.get('/api/load_price', async (request, reply) => {
    let errors = await fastify.sequelize.transaction(async () => {
      return await documentService.loadPrice('assets/files/price.csv');
    })

    return reply.send((errors.length ? { success: true, errors: errors } : { success: true }));
  });

  fastify.get('/api/delete_loaded_price', async (request, reply) => {
    let errors = await fastify.sequelize.transaction(async () => {
      return await documentService.deleteLoadedPrice();
    })

    return reply.send({ success: true });
  });
}

module.exports = routes
