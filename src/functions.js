'use strict';

async function insertByN(queryInterface, tableName, totalCount, recordCallback, N) {
  N = N || 10000;

  let records = [];
  let actualCount = 0;
  for (let i = 1; i <= totalCount; i++) {
    let record = recordCallback(i);
    if (record === null) continue;
    records.push(record);
    actualCount++;

    if (records.length >= N) {
      await queryInterface.bulkInsert(tableName, records);
      records = [];
      process.stdout.write("\r" + tableName + ': ' +  actualCount + '/' + totalCount);
    }
  }

  if (records.length > 0) {
    await queryInterface.bulkInsert(tableName, records);
    process.stdout.write("\r" + tableName + ': ' +  actualCount + '/' + totalCount);
  }

  process.stdout.write("\n");
}

function randomInt(from, to) {
  return from + ((Math.random() * (to - from + 1)) | 0);
}

function substractDays(days, startDate) {
  let date = startDate || new Date();
  date.setDate(date.getDate() - days);

  return date;
}

module.exports = {
  insertByN,
  randomInt,
  substractDays,
};
