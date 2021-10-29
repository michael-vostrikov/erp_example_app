'use strict';
const { insertByN, randomInt, substractDays } = require('../src/functions');
const {
  exchange_rate_days,
  price_days
} = require('../src/constants');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0, SQL_LOG_BIN = 0, UNIQUE_CHECKS = 0");
    const transaction = await queryInterface.sequelize.transaction();

    let records, result;

    let priceTypes = [
      {id: 1, name: 'Себестоимость'},
      {id: 2, name: 'Оптовый'},
      {id: 3, name: 'Розничный'},
      {id: 4, name: 'Прайс Поставщика 1'},
    ];
    await queryInterface.bulkInsert('price_types', priceTypes);

    records = [
      {id: 1, name: 'Рубль', abbr: 'Р'},
      {id: 2, name: 'Доллар', abbr: '$'},
      {id: 3, name: 'Евро', abbr: 'Е'},
    ];
    await queryInterface.bulkInsert('currency', records);

    process.stdout.write('currency_id: ' + 2 + "\n");
    await insertByN(queryInterface, 'exchange_rate', exchange_rate_days, function (i) {
      let date = substractDays(i);
      return {currency_id: 2, date: date, value: 70 + Math.random() * 20};
    });

    process.stdout.write('currency_id: ' + 3 + "\n");
    await insertByN(queryInterface, 'exchange_rate', exchange_rate_days, function (i) {
      let date = substractDays(i);
      return {currency_id: 3, date: date, value: 80 + Math.random() * 20};
    });

    [result] = await queryInterface.sequelize.query('SELECT COUNT(*) cnt FROM materials');
    let materials_count = result[0]['cnt'] ?? 0;

    for (let j = 1; j < priceTypes.length; j++) {
      process.stdout.write('price_type_id: ' + j + "\n");
      let price_type_id = priceTypes[j - 1].id;

      for (let day = price_days; day >= 1; day--) {
        process.stdout.write('day: ' + day + "\n");

        await insertByN(queryInterface, 'prices', materials_count, function (i) {
          let needFill = (
            // на первую дату заполним всегда
            day === price_days
            // для прайса "Себестоимость" цена меняется часто
            || price_type_id === 1 && Math.random() < 0.5
            // для остальных прайсов цена меняется редко
            || price_type_id !== 1 && Math.random() < 0.01
          );

          if (!needFill) {
            return null;
          }

          let record = {
            date: substractDays(day === price_days ? 2000 + day : day),
            price_type_id: price_type_id,
            material_id: i,
            price: Math.random() * 10000,
            currency_id: (price_type_id === 1 ? 1 : randomInt(1, 3)),
          };

          return record;
        });
      }
    }

    let promo_discounts_count = materials_count >= 10000 ? 10000 : (materials_count * 0.2) | 0;

    let materialIds = Array.from(Array(materials_count).keys());
    materialIds[0] = materials_count;
    materialIds = materialIds.sort(() => randomInt(-1, 1)).slice(0, promo_discounts_count);
    await insertByN(queryInterface, 'promo_discounts', promo_discounts_count, function (i) {
      return {
        material_id: materialIds[i - 1],
        beg_date: substractDays(randomInt(300, 599)),
        end_date: substractDays(299),
        price_type_id: 1,
        coefficient: 0.5,
      };
    });

    materialIds = Array.from(Array(materials_count).keys());
    materialIds[0] = materials_count;
    materialIds = materialIds.sort(() => randomInt(-1, 1)).slice(0, promo_discounts_count);
    await insertByN(queryInterface, 'promo_discounts', promo_discounts_count, function (i) {
      return {
        material_id: materialIds[i - 1],
        beg_date: substractDays(randomInt(1, 298)),
        end_date: null,
        price_type_id: 1,
        coefficient: 0.5,
      };
    });

    [result] = await queryInterface.sequelize.query('SELECT MIN(id) min_id, COUNT(*) cnt FROM organizations WHERE type = \'client\'');
    let min_manufacturer_id = 8, max_manufacturer_id = result[0]['min_id'] - 1;
    let clients_count = result[0]['cnt'];


    await insertByN(queryInterface, 'client_price', clients_count, function (i) {
      return {
        organization_id_client: i + max_manufacturer_id,
        price_type_id: randomInt(2, 3),
        coefficient: 1 - Math.random() / 10,
      };
    });


    let organizationIds = Array.from(Array(max_manufacturer_id - min_manufacturer_id + 1).keys());
    organizationIds = organizationIds.map((e) => e + min_manufacturer_id);
    organizationIds = organizationIds.sort(() => randomInt(-1, 1)).slice(0, 3);

    for (let j = 1; j <= 3; j++) {
      process.stdout.write('client_manufacturer_price: ' + j + "\n");

      await insertByN(queryInterface, 'client_manufacturer_price', clients_count, function (i) {
        return {
          organization_id_client: i + max_manufacturer_id,
          organization_id_manufacturer: organizationIds[j - 1],
          price_type_id: randomInt(2, 3),
          coefficient: 1 - Math.random() / 10,
        };
      });
    }

    materialIds = Array.from(Array(materials_count).keys());
    materialIds[0] = materials_count;
    materialIds = materialIds.sort(() => randomInt(-1, 1)).slice(0, 16);

    for (let j = 1; j <= 16; j++) {
      process.stdout.write('client_material_price: ' + j + "\n");

      await insertByN(queryInterface, 'client_material_price', clients_count, function (i) {
        return {
          organization_id_client: i + max_manufacturer_id,
          material_id: materialIds[j - 1],
          price_type_id: randomInt(2, 3),
          coefficient: 1 - Math.random() / 10,
        };
      });
    }

    process.stdout.write('\ndone\n');

    await transaction.commit();
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1, SQL_LOG_BIN = 1, UNIQUE_CHECKS = 1");
  },

  down: async (queryInterface, Sequelize) => {
    process.stdout.write('delete data...\n');

    await queryInterface.sequelize.query('TRUNCATE client_material_price');
    await queryInterface.sequelize.query('TRUNCATE client_manufacturer_price');
    await queryInterface.sequelize.query('TRUNCATE client_price');
    await queryInterface.sequelize.query('TRUNCATE promo_discounts');
    await queryInterface.sequelize.query('TRUNCATE prices');
    await queryInterface.sequelize.query('TRUNCATE exchange_rate');
    await queryInterface.sequelize.query('DELETE FROM currency');
    await queryInterface.sequelize.query('DELETE FROM price_types');
  }
};
