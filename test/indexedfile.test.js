const promisify = require('es6-promisify').promisify
const fs =
  // eslint-disable-next-line camelcase
  typeof __webpack_require__ !== 'function' ? require('fs') : undefined

const fsOpen = fs && fs.open && promisify(fs.open)
const fsRead = fs && fs.read && promisify(fs.read)
const fsFStat = fs && fs.fstat && promisify(fs.fstat)

const { BgzfFilehandle } = require('../src')

async function testRead(basename, length, position) {
  const f = new BgzfFilehandle({
    path: require.resolve(`./data/${basename}.gz`),
    gziPath: require.resolve(`./data/${basename}.gz.gzi`),
  })

  const buf1 = Buffer.allocUnsafe(length)
  const buf2 = Buffer.allocUnsafe(length)
  const bytesRead = await f.read(buf1, 0, length, position)
  const fd = await fsOpen(require.resolve(`./data/${basename}`), 'r')
  const directBytesRead = await fsRead(fd, buf2, 0, length, position)
  expect(bytesRead.bytesRead).toEqual(directBytesRead)
  expect(Array.from(buf1.slice(0, bytesRead))).toEqual(
    Array.from(buf2.slice(0, bytesRead)),
  )

  const directStat = await fsFStat(fd)
  const myStat = await f.stat()
  expect(myStat.size).toEqual(directStat.size)
}

describe('indexed BGZF file', () => {
  it('can read gff3_with_syncs.gff3.gz', async () => {
    await testRead('gff3_with_syncs.gff3', 10, 0)
    await testRead('gff3_with_syncs.gff3', 10, 100)
    await testRead('gff3_with_syncs.gff3', 1000, 100)
    await testRead('gff3_with_syncs.gff3', 2500, 0)
    await testRead('gff3_with_syncs.gff3', 3000, 1)
  })
  it('can read T_ko.2bit', async () => {
    await testRead('T_ko.2bit', 10, 0)
    await testRead('T_ko.2bit', 10000, 20000)
    await testRead('T_ko.2bit', 10000, 1)
    await testRead('T_ko.2bit', 10, 0)
    await testRead('T_ko.2bit', 10, 1000000)
  })
})
