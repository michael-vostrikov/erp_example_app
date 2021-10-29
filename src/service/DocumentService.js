'use strict';

const ValidationError = require('../../src/ValidationError');
const { Op } = require('sequelize');
const csv = require('@fast-csv/parse');

class DocumentService {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }

  async init() {
    const { DocumentType, ExchangeRate, Currency } = this.sequelize.models;

    this.documentTypeMap = (await DocumentType.findAll()).indexBy('id');
    this.currencyMap = (await Currency.findAll()).reduce((res, currency) => {
      res[currency.abbr] = currency;
      res[currency.id] = currency;
      return res;
    }, {});

    this.queryGenerator = (await this.sequelize.getQueryInterface()).queryGenerator;

    let exchangeRateList = await ExchangeRate.findAll({ order: ['currency_id', 'date'] });
    let exchangeRateListByCurrency = {};
    for (let exchangeRate of exchangeRateList) {
      if (exchangeRateListByCurrency[exchangeRate.currency_id] === undefined) {
        exchangeRateListByCurrency[exchangeRate.currency_id] = [];
      }
      exchangeRateListByCurrency[exchangeRate.currency_id].push(exchangeRate);
    }

    // курсы валют это небольшое количество данных, можно держать в приложении данные на каждый день

    let exchangeRateMap = {};
    for (let [currencyId, currencyRateList] of Object.entries(exchangeRateListByCurrency)) {
      // используем Map, так как он сохраняет порядок добавления элементов
      let map = new Map();

      for (let i = 0; i < currencyRateList.length; i++) {
        let exchangeRate = currencyRateList[i];
        let nextExchangeRate = currencyRateList[i + 1];

        let dateParts = exchangeRate.date.split('-');
        dateParts[1]--;
        let currentDate = new Date(...dateParts);

        let endDateStr;
        if (nextExchangeRate === undefined) {
          let endDate = (new Date(...dateParts));
          endDate.setDate(endDate.getDate() + 1);
          endDateStr = endDate.getYmd();
        } else {
          endDateStr = nextExchangeRate.date;
        }

        do {
          map.set(currentDate.getYmd(), exchangeRate.value);

          currentDate.setDate(currentDate.getDate() + 1);
        } while (currentDate.getYmd() < endDateStr);
      }

      exchangeRateMap[currencyId] = map;
    }

    this.exchangeRateMap = exchangeRateMap;
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


  async getMaterialsPriceCurrentStock(document, term, limitStock, offset, limit) {
    const { CurrentStock, Material, ClientMaterialPrice, ClientManufacturerPrice, ClientPrice } = this.sequelize.models;

    let filter = {
      organization_id_address: document.organization_id_address,
      organization_id_ur: document.organization_id_ur,
      '$Material.name$': { [Op.like]: '%' + term + '%' },
    };
    if (limitStock) {
      filter.cnt = { [Op.gt]: this.sequelize.col('reserve') };
    }

    let stocks = (await CurrentStock.findAll({
      include: [Material], where: filter, limit: limit, offset: offset,
      order: [
        [this.sequelize.where(this.sequelize.col('Material.name'), { [Op.like]: term + '%' }), 'DESC'],
        this.sequelize.col('Material.name')
      ],
    })).indexBy('material_id');

    let materialIds = Object.keys(stocks);
    if (materialIds.length === 0) {
      return [];
    }


    let manufacturerIds = materialIds.map((materialId) => stocks[materialId].Material.organization_id_manufacturer);
    let clientId = document.organization_id_client;
    let date = document.date;

    let [res1, res2, res3] = await Promise.all([
      ClientMaterialPrice.findAll({
        where: { organization_id_client: clientId, material_id: materialIds },
      }),
      ClientManufacturerPrice.findAll({
        where: { organization_id_client: clientId, organization_id_manufacturer: manufacturerIds },
      }),
      ClientPrice.findOne({
        where: { organization_id_client: clientId },
      }),
    ]);

    let clientPriceListByMaterial = res1.indexBy('material_id');
    let clientPriceListByManufacturer = res2.indexBy('organization_id_manufacturer');
    let clientPriceCommon = res3;

    let clientPricesByMaterial = {};
    let priceTypeIds = {};
    for (let materialId of materialIds) {
      let manuacturerId = stocks[materialId].Material.organization_id_manufacturer;
      let clientPrice = clientPriceListByMaterial[materialId]
        ?? clientPriceListByManufacturer[manuacturerId]
        ?? clientPriceCommon;

      clientPricesByMaterial[materialId] = clientPrice;
      priceTypeIds[clientPrice.price_type_id] = clientPrice.price_type_id;
    }
    priceTypeIds = Object.values(priceTypeIds);


    let [priceRecordMap, promoDiscountMap] = await Promise.all([
      this._findPrices(materialIds, priceTypeIds, date),
      this._findDiscounts(materialIds, priceTypeIds, date),
    ]);
    priceRecordMap = priceRecordMap.indexBy((row) => row.material_id + '_' + row.price_type_id);
    promoDiscountMap = promoDiscountMap.indexBy((row) => row.material_id + '_' + row.price_type_id);

    let result = [];
    for (let materialId of materialIds) {
      let clientPrice = clientPricesByMaterial[materialId];
      let priceTypeId = clientPrice.price_type_id;
      let priceRecord = priceRecordMap[materialId + '_' + priceTypeId];
      let promoDiscount = promoDiscountMap[materialId + '_' + priceTypeId] ?? null;

      let exchangeRateValue = (priceRecord.currency_id === 1 ? 1
        // если данные на заданную дату отсутствуют, значит дата больше последней записи, берем последнюю ставку
        : this.exchangeRateMap[priceRecord.currency_id].get(date.getYmd()) ?? [...this.exchangeRateMap[priceRecord.currency_id].values()].pop()
      );

      let coefficient = (1 - Math.max(clientPrice.coefficient, (promoDiscount ? promoDiscount.coefficient : 0)));
      let materialPrice = priceRecord.price * exchangeRateValue * coefficient;

      let stock = stocks[materialId];
      result.push({
        id: materialId, name: stock.Material.name, cnt: stock.cnt,
        price: materialPrice.toFixed(2), currency: this.currencyMap[priceRecord.currency_id].abbr,
      });
    }

    return result;
  }

  _findPrices(materialIds, priceTypeIds, date) {
    const { Price } = this.sequelize.models;

    let sqlPrices = this.queryGenerator.selectQuery(Price.tableName, {
      attributes: [
        this.sequelize.literal('*'),
        this.sequelize.literal('ROW_NUMBER() OVER (PARTITION BY material_id, price_type_id ORDER BY date DESC) AS rn'),
      ],
      where: { material_id: materialIds, price_type_id: priceTypeIds, date: { [Op.lte]: date } },
    }, null);
    sqlPrices = 'WITH prices_cte AS (' + sqlPrices.slice(0, -1) + ') SELECT * FROM prices_cte WHERE rn = 1';

    return this.sequelize.query(sqlPrices).then((res) => res[0]);
  }

  _findDiscounts(materialIds, priceTypeIds, date) {
    const { PromoDiscount } = this.sequelize.models;

    let sqlDiscounts = this.queryGenerator.selectQuery(PromoDiscount.tableName, {
      attributes: [
        this.sequelize.literal('*'),
        this.sequelize.literal('ROW_NUMBER() OVER (PARTITION BY material_id, price_type_id ORDER BY beg_date DESC) AS rn'),
      ],
      where: { material_id: materialIds, price_type_id: priceTypeIds, beg_date: { [Op.lte]: date } },
    }, null);
    sqlDiscounts = 'WITH discount_cte AS (' + sqlDiscounts.slice(0, -1) + ') SELECT * FROM discount_cte WHERE rn = 1';

    return this.sequelize.query(sqlDiscounts).then((res) => res[0]);
  }


  async loadPrice(filename) {
    const { PriceType, Price } = this.sequelize.models;

    let rows = await this.getCsvRows(filename);

    let priceDate = rows[0].name;
    let errors = this._validateRows(rows);
    if (errors.length > 0) {
      return errors;
    }
    rows = rows.slice(2);


    let priceTypeId = 4;
    await PriceType.findOne({ where: { id: priceTypeId }, lock: true });

    console.log(new Date(), 'start');

    let manufacturerMap = await this._buildManufacturerMap(rows);
    let materialMap = await this._buildMaterialMap(rows, manufacturerMap);

    let materialIds = Object.values(materialMap).map((material) => material.id);
    let existingPriceRecords = (await this._findPrices(materialIds, [priceTypeId], priceDate)).indexBy('material_id');

    let priceRowsToUpdate = [];
    let priceRowsToInsert = [];
    for (let row of rows) {
      let materialId = materialMap[row.name].id;

      let priceRow = {
        date: priceDate,
        price_type_id: priceTypeId,
        material_id: materialId,
        price: row.price,
        currency_id: this.currencyMap[row.currency].id,
      };

      let priceRecord = existingPriceRecords[materialId];
      if (priceRecord !== undefined) {
        // если последняя цена по материалу такая же, не добавляем запись на новую дату
        let isSamePrice = priceRecord.price === row.price && priceRecord.currency_id === this.currencyMap[row.currency].id;
        if (!isSamePrice) {
          priceRowsToUpdate.push(priceRow);
        }
      } else {
        priceRowsToInsert.push(priceRow);
      }
    }

    console.log(new Date(), 'update', priceRowsToUpdate.length);
    await Price.bulkCreate(priceRowsToUpdate, { updateOnDuplicate: ['price', 'currency'] });

    console.log(new Date(), 'insert', priceRowsToInsert.length);
    await Price.bulkCreate(priceRowsToInsert);

    console.log(new Date(), 'complete', "\n");

    return [];
  }

  async getCsvRows(filename) {
    let rows = [];
    await new Promise((resolve, reject) => {
      csv.parseFile(filename, { delimiter: '\t', headers: ['name', 'manufacturer', 'price', 'currency'] })
        .on('data', row => rows.push(row))
        .on('error', error => reject(error))
        .on('end', (rowCount) => resolve(rowCount));
    });

    return rows;
  }

  _validateRows(rows) {
    let priceDate = rows[0].name;
    if (!priceDate.match(/\d\d\d\d-\d\d-\d\d/)) {
      return [{row: 1, errors: ['Неправильный формат даты']}];
    }

    let errors = [];
    for (let rowIndex = 2; rowIndex < rows.length; rowIndex++) {
      let row = rows[rowIndex];
      let rowErrors = this._validateRow(row);

      if (rowErrors.length > 0) {
        errors.push({ row: rowIndex + 1, errors: rowErrors });

        if (errors.length >= 100) {
          break;
        }
      }
    }

    return errors;
  }

  _validateRow(row) {
    let rowErrors = [];

    let isPriceValid = (!isNaN(row.price) && parseFloat(row.price) >= 0);
    if (!isPriceValid) {
      rowErrors.push('Неправильно указана цена');
    }
    if (this.currencyMap[row.currency] === undefined) {
      rowErrors.push('Неизвестная валюта');
    }

    return rowErrors;
  }

  async _buildManufacturerMap(rows) {
    const { Organization } = this.sequelize.models;

    let manufacturerNameList = rows.reduce((res, row) => {
      return res.set(row.manufacturer, row.manufacturer);
    }, new Map());

    let manufacturerMap = (await Organization.findAll({
      where: { name: [...manufacturerNameList.keys()], type: Organization.TYPE_MANUFACTURER },
      lock: true,
    })).indexBy('name');

    let newManufacturerList = [...manufacturerNameList.values()]
      .filter((name) => (manufacturerMap[name] === undefined))
      .map((name) => ({ type: Organization.TYPE_MANUFACTURER, name: name }));

    (await Organization.bulkCreate(newManufacturerList)).forEach((manufacturer) => {
      manufacturerMap[manufacturer.name] = manufacturer;
    });

    return manufacturerMap;
  }

  async _buildMaterialMap(rows, manufacturerMap) {
    const { Material } = this.sequelize.models;

    let materialNameList = rows.reduce((res, row) => {
      return res.set(row.name, { name: row.name, manufacturer: row.manufacturer });
    }, new Map());

    let materialMap = (await Material.findAll({
      where: { name: [...materialNameList.keys()] },
      lock: true,
    })).indexBy('name');

    let newMaterialList = [...materialNameList.values()]
      .filter((data) => (materialMap[data.name] === undefined))
      .map((data) => {
        return { name: data.name, organization_id_manufacturer: manufacturerMap[data.manufacturer].id };
      });

    (await Material.bulkCreate(newMaterialList)).forEach((material) => {
      materialMap[material.name] = material;
    });

    return materialMap;
  }

  async deleteLoadedPrice() {
    const { materials_count } = require('../constants');
    await this.sequelize.query("DELETE FROM prices WHERE price_type_id = 4");
    await this.sequelize.query("DELETE FROM materials WHERE CONVERT(SUBSTRING(name, 7, CHAR_LENGTH(name) - 6), UNSIGNED INTEGER) >= " + (materials_count + 1));
    await this.sequelize.query("DELETE FROM organizations WHERE name = 'Производитель 12'");
  }
}

module.exports = DocumentService;
