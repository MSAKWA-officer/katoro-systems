require('dotenv').config();
const { Sequelize } = require('sequelize');

// Chagua injini ya database kwa env variable moja: DB_DIALECT=mysql (default,
// ndiyo Aiven yako ya sasa) au DB_DIALECT=postgres (kwa Render). Hakuna
// sehemu nyingine ya msimbo inayohitaji kujua ni database gani inatumika —
// Sequelize ndiye anayeshughulikia tofauti za SQL kati ya hizo mbili.
const dialect = (process.env.DB_DIALECT || 'mysql').toLowerCase();

if (!['mysql', 'postgres'].includes(dialect)) {
  throw new Error(
    `DB_DIALECT isiyotambulika: "${dialect}". Tumia "mysql" au "postgres" kwenye .env.`
  );
}

// Bandari chaguo-msingi kwa kila injini — DB_PORT yako ya sasa (20363 ya
// Aiven) bado inatumika kwa sababu ipo wazi kwenye .env, hii ni fallback tu.
const defaultPort = dialect === 'postgres' ? 5432 : 3306;

const sslOptions = {
  dialectOptions: {
    // Aiven (MySQL) na Render (PostgreSQL) zote zinahitaji SSL kwa muunganiko
    // wa nje — muundo huu huu unafanya kazi kwa madereva yote mawili
    // (mysql2 na pg), hivyo hakuna haja ya kubadilisha chochote hapa
    // unapobadilisha DB_DIALECT.
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false // Inakubali cheti la Aiven/Render bila kuhitaji kupakua faili la .pem
    } : false
  }
};

const commonOptions = {
  dialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
  },
  ...sslOptions,
};

// Njia mbili za ku-configure: DATABASE_URL moja (mfano Render inavyotoa
// "postgresql://user:pass@host:port/dbname") AU DB_HOST/DB_USER/DB_PASSWORD/
// DB_NAME tofauti (mfano wa Aiven wako wa sasa). Ukiweka DATABASE_URL, hiyo
// ndiyo itatumika — hakuna haja ya kuigawa vipande vipande wewe mwenyewe.
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, commonOptions)
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || defaultPort,
        ...commonOptions,
      }
    );

module.exports = sequelize;
