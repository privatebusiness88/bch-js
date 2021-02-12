/*
  High-level functions for working with UTXOs

  TODO:
  - Make a getWL() clone of get(), but uses hydrateUtxosWL()
*/

// Local libraries
const Electrumx = require('./electrumx')
const Slp = require('./slp/slp')

class UTXO {
  constructor (config) {
    // Encapsulate dependencies for easier mocking.
    this.electrumx = new Electrumx(config)
    this.slp = new Slp(config)
  }

  /**
   * @api Utxo.get() get()
   * @apiName get
   * @apiGroup UTXO
   * @apiDescription Get UTXOs for an address
   *
   * Given an address, this function will return an object with three arrays:
   * - bchUtxos - UTXOs confirmed to be spendable as normal BCH
   * - slpUtxos - UTXOs confirmed to be colored as valid SLP tokens
   * - nullUtxo - UTXOs that did not pass SLP validation. Should be ignored and
   *   not spent, to be safe.
   *
   * @apiExample Example usage:
   * (async () => {
   *   try {
   *     let utxos = await bchjs.Utxo.get('simpleledger:qzv3zz2trz0xgp6a96lu4m6vp2nkwag0kvyucjzqt9');
   *     console.log(utxos);
   *   } catch(error) {
   *    console.error(error)
   *   }
   * })()
   *
   * // returns
   * {
   *  "bchUtxos": [
   *   {
   *    "height": 674331,
   *    "tx_hash": "5e86cd911110e4f5db0cc3e8f459d5e8850b49adf57059a71daee674b2867b31",
   *    "tx_pos": 0,
   *    "value": 1000,
   *    "txid": "5e86cd911110e4f5db0cc3e8f459d5e8850b49adf57059a71daee674b2867b31",
   *    "vout": 0,
   *    "isValid": false
   *   }
   *  ],
   *  "slpUtxos": [
   *   {
   *    "height": 569108,
   *    "tx_hash": "384e1b8197e8de7d38f98317af2cf5f6bcb50007c46943b3498a6fab6e8aeb7c",
   *    "tx_pos": 1,
   *    "value": 546,
   *    "txid": "384e1b8197e8de7d38f98317af2cf5f6bcb50007c46943b3498a6fab6e8aeb7c",
   *    "vout": 1,
   *    "utxoType": "token",
   *    "transactionType": "send",
   *    "tokenId": "a436c8e1b6bee3d701c6044d190f76f774be83c36de8d34a988af4489e86dd37",
   *    "tokenTicker": "sleven",
   *    "tokenName": "sleven",
   *    "tokenDocumentUrl": "sleven",
   *    "tokenDocumentHash": "",
   *    "decimals": 7,
   *    "tokenType": 1,
   *    "tokenQty": "1",
   *    "isValid": true
   *   }
   *  ],
   *  "nullUtxos": []
   * }
   *
   *
   */
  async get (address) {
    try {
      const addr = this.slp.Address.toCashAddress(address)

      // Get the UTXOs associated with the address.
      const utxoData = await this.electrumx.utxo([addr])
      // console.log(`utxoData: ${JSON.stringify(utxoData, null, 2)}`)

      // Hydate the utxos with token information.
      const hydratedUtxos = await this.slp.Utils.hydrateUtxos(utxoData.utxos)
      // console.log(`hydratedUtxos: ${JSON.stringify(hydratedUtxos, null, 2)}`)

      const retObj = {} // return object

      // Filter out the different types of UTXOs.
      retObj.bchUtxos = hydratedUtxos.slpUtxos[0].utxos.filter(elem => elem.isValid === false)
      retObj.slpUtxos = hydratedUtxos.slpUtxos[0].utxos.filter(elem => elem.isValid === true)
      retObj.nullUtxos = hydratedUtxos.slpUtxos[0].utxos.filter(elem => elem.isValid === null)
      // Note: true, false, and null should be only values. An element with
      // isValid set to any other value should be ignored.

      return retObj
    } catch (err) {
      console.error('Error in bchjs.utxo.get()')
      throw err
    }
  }
}

module.exports = UTXO
