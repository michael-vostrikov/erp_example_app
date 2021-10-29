'use strict';

const ValidationError = require('../../src/ValidationError');

class DocumentService {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }

  async init() {
    const { DocumentType } = this.sequelize.models;

    this.documentTypeMap = (await DocumentType.findAll()).indexBy('id');
  }


  // closingType - 1 закрытие, -1 открытие
  async closeDoc(document, closingType) {
    const { DocumentType, DocumentPosition, CurrentStock } = this.sequelize.models;

    if (document.status === closingType) {
      throw new ValidationError('Документ уже находится в этом статусе');
    }

    let documentPositions = await DocumentPosition.findAll({ where: { document_id: document.id }, order: ['material_id'] });

    if (document.document_type_id === DocumentType.ZPS || document.document_type_id === DocumentType.PLAN_PROIZVODSTVA) {
      let notEmptyPositions = documentPositions.filter((e) => (e.cnt !== null && e.cnt !== 0));
      if (notEmptyPositions.length > 0) {
        throw new ValidationError('Документы данного типа нельзя закрывать если есть позиции с не нулевыми количествами');
      }
    }

    let documentType = this.documentTypeMap[document.document_type_id];
    if (documentType === undefined) {
      throw new Error('Unknown document type: ' + document.document_type_id);
    }

    let pkFilter =  {
      organization_id_address: document.organization_id_address,
      organization_id_ur: document.organization_id_ur,
      material_id: documentPositions.map((position) => position.material_id),
    };
    let curStocks = (await CurrentStock.findAll({where: pkFilter, lock: true})).indexBy('material_id');

    let newData = [];
    for (let position of documentPositions) {
      // hack with multiplication by business value, be careful!
      let newCnt = (position.cnt ?? 0) * -1 * closingType * documentType.credit_type;
      let curStock = curStocks[position.material_id] ?? {cnt: 0, reserve: 0};

      newData.push({
        organization_id_address: document.organization_id_address,
        organization_id_ur: document.organization_id_ur,
        material_id: position.material_id,

        cnt: curStock.cnt + newCnt,
        reserve: curStock.reserve + (documentType.credit_type === 1 ? newCnt : 0),
      });
    }

    await CurrentStock.bulkCreate(newData, {updateOnDuplicate: ['cnt', 'reserve']});
    await CurrentStock.destroy({where: {...pkFilter, cnt: 0, reserve: 0}});

    document.closed = (closingType === -1 ? 0 : 1);
    await document.save();
  }
}

module.exports = DocumentService;
