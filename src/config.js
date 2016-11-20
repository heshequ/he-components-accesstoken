const mysql = require('mysql')

/**
 * mysql 数据库设置
 */
const MYSQL_DATABASE = {
  TOKEN: {
    host: 'localhost',
    user: 'root',
    password: 'Ac591234',
    database: 'he_wetoken'
  }
}

/**
 * mysql 连接池对象
 */
const MYSQL = {
  TOKEN: mysql.createPool(MYSQL_DATABASE.TOKEN)
}

/**
 * 导出
 */
exports.MYSQL = MYSQL
