import assert from 'assert'
import { RPC } from '../src/rpc.js'
import { Message } from '../src/message.js'
import * as Wallet from '../src/wallet.js'
import { Address } from '../src/index.js'

const API = 'https://api.calibration.node.glif.io'

describe('lotus rpc', function () {
  this.retries(3)
  this.timeout(10_000)
  it(`version`, async function () {
    const rpc = new RPC({ api: API })

    const version = await rpc.version()
    if (version.error) {
      return assert.fail(version.error.message)
    }

    assert(version.result.Version)
    assert(version.result.APIVersion)
    assert(version.result.BlockDelay)
  })

  it(`networkName`, async function () {
    const rpc = new RPC({ api: API })

    const version = await rpc.networkName()
    if (version.error) {
      return assert.fail(version.error.message)
    }

    assert.equal(version.result, 'calibrationnet')
  })

  it(`nonce`, async function () {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const version = await rpc.nonce('t1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna')
    if (version.error) {
      return assert.fail(version.error.message)
    }

    assert.ok(Number.isInteger(version.result))
  })

  it(`nonce fail with wrong network`, async function () {
    const rpc = new RPC({ api: API, network: 'testnet' })

    await assert.rejects(() =>
      rpc.nonce('f1jbnosztqwadgh4smvsnojdvwjgqxsmtzy5n5imi')
    )
  })

  it(`gas estimate`, async function () {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const nonce = await rpc.nonce('t1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna')
    if (nonce.error) {
      return assert.fail(nonce.error.message)
    }

    const msg = new Message({
      from: 't1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna',
      to: 't1sfizuhpgjqyl4yjydlebncvecf3q2cmeeathzwi',
      nonce: nonce.result,
      value: '100000000000000000',
    })

    const estimate = await rpc.gasEstimate(msg)
    if (estimate.error) {
      return assert.fail(estimate.error.message)
    }

    assert.equal(Message.fromLotus(estimate.result).value, msg.value)
  })

  it(`gas estimate to delegated address`, async function () {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const nonce = await rpc.nonce('t1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna')
    if (nonce.error) {
      return assert.fail(nonce.error.message)
    }

    const msg = new Message({
      from: 't1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna',
      to: 't410fpzfl2y5hzayuzqunhcbqgrzdkpmij4uswh5uumi',
      nonce: nonce.result,
      value: '100000000000000000',
    })

    const estimate = await rpc.gasEstimate(msg)
    if (estimate.error) {
      return assert.fail(estimate.error.message)
    }

    assert.equal(Message.fromLotus(estimate.result).value, msg.value)
  })

  it(`gas estimate to 0x address`, async function () {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const nonce = await rpc.nonce('t1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna')
    if (nonce.error) {
      return assert.fail(nonce.error.message)
    }

    const msg = new Message({
      from: 't1pc2apytmdas3sn5ylwhfa32jfpx7ez7ykieelna',
      to: Address.from(
        '0x7e4ABd63A7C8314Cc28D388303472353D884f292',
        'testnet'
      ).toString(),
      nonce: nonce.result,
      value: '100000000000000000',
    })

    const estimate = await rpc.gasEstimate(msg)
    if (estimate.error) {
      return assert.fail(estimate.error.message)
    }

    assert.equal(Message.fromLotus(estimate.result).value, msg.value)
  })

  it(`balance`, async function () {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const balance = await rpc.balance(
      't1jzly7yqqff5fignjddktuo2con2pjoz5yajemli'
    )
    if (balance.error) {
      return assert.fail(balance.error.message)
    }

    assert.ok(typeof balance.result === 'string')
  })

  it(`balance from delegated address`, async function () {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const balance = await rpc.balance(
      't410fpzfl2y5hzayuzqunhcbqgrzdkpmij4uswh5uumi'
    )
    if (balance.error) {
      return assert.fail(balance.error.message)
    }

    assert.ok(typeof balance.result === 'string')
    assert.ok(BigInt(balance.result) > 0n)
  })

  it(`balance from 0x address`, async function () {
    const rpc = new RPC({ api: API, network: 'testnet' })

    const balance = await rpc.balance(
      Address.from(
        '0x7e4ABd63A7C8314Cc28D388303472353D884f292',
        'testnet'
      ).toString()
    )
    if (balance.error) {
      return assert.fail(balance.error.message)
    }

    assert.ok(typeof balance.result === 'string')
    assert.ok(BigInt(balance.result) > 0n)
  })

  it(`send message`, async function () {
    const rpc = new RPC({ api: API, network: 'testnet' })
    const account = Wallet.accountFromMnemonic(
      'already turtle birth enroll since owner keep patch skirt drift any dinner',
      'SECP256K1',
      "m/44'/1'/0'/0/0",
      'testnet'
    )
    const message = await new Message({
      to: 't1sfizuhpgjqyl4yjydlebncvecf3q2cmeeathzwi',
      from: account.address.toString(),
      value: '1',
    }).prepare(rpc)

    const balance = await rpc.pushMessage(message, {
      type: 'SECP256K1',
      data: Wallet.signMessage(account.privateKey, 'SECP256K1', message),
    })
    if (balance.error) {
      return assert.fail(balance.error.message)
    }

    assert.ok(typeof balance.result['/'] === 'string')
  })

  it(`send message to 0x`, async function () {
    const rpc = new RPC({ api: API, network: 'testnet' })
    const account = Wallet.accountFromMnemonic(
      'already turtle birth enroll since owner keep patch skirt drift any dinner',
      'SECP256K1',
      "m/44'/1'/0'/0/0",
      'testnet'
    )
    const message = await new Message({
      to: Address.from(
        '0x7e4ABd63A7C8314Cc28D388303472353D884f292',
        'testnet'
      ).toString(),
      from: account.address.toString(),
      value: '1',
    }).prepare(rpc)

    const balance = await rpc.pushMessage(message, {
      type: 'SECP256K1',
      data: Wallet.signMessage(account.privateKey, 'SECP256K1', message),
    })
    if (balance.error) {
      return assert.fail(balance.error.message)
    }

    assert.ok(typeof balance.result['/'] === 'string')
  })
})
