// Ongeza safu za "transfer student" kwenye jedwali la `students` lililopo
// tayari (haiathiri MySQL wala PostgreSQL — Sequelize ndiye anayeshughulikia
// tofauti ya SQL kati ya hizo mbili). Endesha mara moja tu, muda wowote
// baada ya DB_DIALECT/DATABASE_URL kubadilika kuelekeza database sahihi:
//
//   node src/utils/addStudentTransferColumns.js
//
// Ni salama kuiendesha zaidi ya mara moja — inaruka column zilizopo tayari.

const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const COLUMNS_TO_ADD = {
  is_transfer_student: { type: DataTypes.BOOLEAN, defaultValue: false },
  previous_school_name: { type: DataTypes.STRING },
  previous_class_level: { type: DataTypes.STRING },
  transfer_date: { type: DataTypes.DATEONLY },
  transfer_certificate_no: { type: DataTypes.STRING },
};

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const qi = sequelize.getQueryInterface();
    const existingColumns = await qi.describeTable('students');

    for (const [columnName, definition] of Object.entries(COLUMNS_TO_ADD)) {
      if (existingColumns[columnName]) {
        console.log(`Column "${columnName}" already exists on students — skipping.`);
        continue;
      }
      await qi.addColumn('students', columnName, definition);
      console.log(`Added column "${columnName}" to students.`);
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to add columns:', err.message);
    process.exit(1);
  }
})();
