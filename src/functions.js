'use strict';

const { DatabaseError } = require('sequelize/lib/errors');
const { Transaction, Sequelize } = require('sequelize');
const ValidationError = require('./ValidationError');

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


async function executeWithRetry(actionCallback, errorCallback)
{
  let tryNumber = 0;
  while (true) {
    try {
      let res = await actionCallback();
      return res;

    } catch (error) {
      tryNumber++;
      let needContinue = await errorCallback(error, tryNumber);
      if (needContinue) {
        continue;
      }

      throw error;
    }
  }
}

async function runInTransaction(sequelize, actionCallback, maxTryNumber)
{
  maxTryNumber = maxTryNumber || 10;

  return Sequelize._clsRun(async () => {
    let transaction = null;

    return await executeWithRetry(async function () {
      transaction = new Transaction(sequelize, undefined);
      await transaction.prepareEnvironment();
      const result = await actionCallback();
      await transaction.commit();
      return result;

    }, async function (error, tryNumber) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      transaction = null;

      if (error instanceof DatabaseError && error.parent && (error.parent.code === 'ER_LOCK_DEADLOCK' || error.parent.code === 'ER_LOCK_WAIT_TIMEOUT')) {
        if (! (tryNumber <= maxTryNumber)) {
          console.log(error);
        }

        return (tryNumber <= maxTryNumber);
      }

      return false;
    });
  });
}

module.exports = {
  insertByN,
  randomInt,
  substractDays,
  executeWithRetry,
  runInTransaction,
};
