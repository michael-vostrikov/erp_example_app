'use strict';
const { insertByN, randomInt, substractDays } = require('../src/functions');
const {
  clients_count,
  materials_count,
  documents_count,
  positions_per_document,
} = require('../src/constants');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0, SQL_LOG_BIN = 0, UNIQUE_CHECKS = 0");
    const transaction = await queryInterface.sequelize.transaction();

    let records;

    records = [
      {id: 1, credit_type: 1, name: 'Отгрузка покупателю'},
      {id: 2, credit_type: -1, name: 'Приход от поставщика'},
      {id: 6, credit_type: 0, name: 'ЗПС'},
      {id: 8, credit_type: 0, name: 'План производства'},
    ];
    await queryInterface.bulkInsert('document_types', records);

    let constOrganizations = [
      {id: 1, type: 'address', name: 'Склад 1'},
      {id: 2, type: 'address', name: 'Склад 2'},
      {id: 3, type: 'address', name: 'Склад 3'},
      {id: 4, type: 'address', name: 'Склад 4'},
      {id: 5, type: 'ur', name: 'Юрлицо 1'},
      {id: 6, type: 'ur', name: 'Юрлицо 2'},
      {id: 7, type: 'ur', name: 'Юрлицо 3'},
      {id: 8, type: 'manufacturer', name: 'Производитель 1'},
      {id: 9, type: 'manufacturer', name: 'Производитель 2'},
      {id: 10, type: 'manufacturer', name: 'Производитель 3'},
      {id: 11, type: 'manufacturer', name: 'Производитель 4'},
      {id: 12, type: 'manufacturer', name: 'Производитель 5'},
      {id: 13, type: 'manufacturer', name: 'Производитель 6'},
      {id: 14, type: 'manufacturer', name: 'Производитель 7'},
      {id: 15, type: 'manufacturer', name: 'Производитель 8'},
      {id: 16, type: 'manufacturer', name: 'Производитель 9'},
      {id: 17, type: 'manufacturer', name: 'Производитель 10'},
      {id: 18, type: 'manufacturer', name: 'Производитель 11'},
    ];
    await queryInterface.bulkInsert('organizations', constOrganizations);

    let constOrganizationsCount = constOrganizations.length;
    await insertByN(queryInterface, 'organizations', clients_count, function (i) {
      return {id: i + constOrganizationsCount, type: 'client', name: 'Клиент ' + i};
    });

    let min_address_id = 1, max_address_id = 4;
    let min_ur_id = 5, max_ur_id = 7;
    let min_manufacturer_id = 8, max_manufacturer_id = constOrganizationsCount;
    let min_client_id = 1 + constOrganizationsCount, max_client_id = clients_count + constOrganizationsCount;

    await insertByN(queryInterface, 'materials', materials_count, function (i) {
      let organization_id_manufacturer = randomInt(min_manufacturer_id, max_manufacturer_id);
      return {id: i, name: 'Товар ' + i, organization_id_manufacturer: organization_id_manufacturer};
    });

    await insertByN(queryInterface, 'documents', documents_count, function (i) {
      let days = randomInt(0, 365);

      return {
        id: i,
        date: substractDays(days),
        document_type_id: [1, 2, 6, 8][randomInt(0, 3)],
        organization_id_address: randomInt(min_address_id, max_address_id),
        organization_id_ur: randomInt(min_ur_id, max_ur_id),
        organization_id_client: randomInt(min_client_id, max_client_id),
        closed: (days > 30),
      };
    });

    await insertByN(queryInterface, 'document_positions', documents_count * positions_per_document, function (i) {
      return {
        id: i,
        document_id: (((i - 1) / positions_per_document) + 1) | 0,
        material_id: randomInt(1, materials_count),
        cnt: randomInt(1, 1000),
      };
    });

    process.stdout.write('current_stock...\n');
    let sql = `
      INSERT INTO current_stock (organization_id_address, organization_id_ur, material_id, cnt, reserve)
      SELECT d.organization_id_address, d.organization_id_ur, dp.material_id
        , SUM(IF(d.closed = 1, IFNULL(dp.cnt, 0) * t.credit_type * -1, 0)) sumcnt
        , SUM(IF(d.closed = 1, 0, IFNULL(dp.cnt, 0) * IF(t.credit_type = 1, 1, 0))) sumreserve
      FROM documents d
        INNER JOIN document_positions dp ON d.id = dp.document_id
        INNER JOIN document_types t ON d.document_type_id = t.id
      WHERE IFNULL(dp.cnt, 0) != 0
        AND t.credit_type IN (-1, 1)
      GROUP BY d.organization_id_address, d.organization_id_ur, dp.material_id
      HAVING sumcnt != 0 OR sumreserve != 0
    `;
    await queryInterface.sequelize.query(sql);

    process.stdout.write('\ndone\n');

    await transaction.commit();
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1, SQL_LOG_BIN = 1, UNIQUE_CHECKS = 1");
  },

  down: async (queryInterface, Sequelize) => {
    process.stdout.write('delete data...\n');

    await queryInterface.sequelize.query('TRUNCATE current_stock');
    await queryInterface.sequelize.query('TRUNCATE document_positions');
    await queryInterface.bulkDelete('documents', null);
    await queryInterface.bulkDelete('materials', null);
    await queryInterface.bulkDelete('organizations', null);
    await queryInterface.bulkDelete('document_types', null);
  }
};
