import { Encrypter } from '../../protocols/encrypter'
import { DbAddAccount } from './db-add-account'

interface MakeTypes {
  dbAddAccount: DbAddAccount
  encrypter: Encrypter
}

const makeEncrypter = (): Encrypter => {
  class Encrypter {
    async encrypt (value: string): Promise<string> {
      return await new Promise(resolve => resolve('hashed_password'))
    }
  }

  return new Encrypter()
}

const makeDbAddAccount = (): MakeTypes => {
  const encrypter = makeEncrypter()
  const dbAddAccount = new DbAddAccount(encrypter)
  return {
    encrypter,
    dbAddAccount
  }
}

describe('DbAddAccount Usecase', () => {
  test('Should call Encrypter with correct password', async () => {
    const { encrypter, dbAddAccount } = makeDbAddAccount()

    const encrypterSpy = jest.spyOn(encrypter, 'encrypt')

    const accountData = {
      name: 'valid_name',
      email: 'valid_email',
      password: 'valid_password'
    }

    await dbAddAccount.add(accountData)
    expect(encrypterSpy).toHaveBeenCalledWith(accountData.password)
  })
})
