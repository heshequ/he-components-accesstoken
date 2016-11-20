const mysql = require('mysql')

/**
 * mysql 数据库设置
 */
const MYSQL_DATABASE = {
  TOKEN: {
    host: 'mysql.rdsm2glams7fhd5.rds.bj.baidubce.com',
    user: 'zdboy',
    password: '123456',
    database: 'access_token'
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
