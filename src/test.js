const {MYSQL} = require('./config')
const main = require('./main')

async function fun() {
  let token = await main.getToken(MYSQL.TOKEN, 'wx6c6398aa27bba6c6', '1cff35124bd1875e17fc840682025077')
  let ticket = await main.getTicket(MYSQL.TOKEN, ticket)
  console.log(token)
  console.log(ticket)
}

fun()