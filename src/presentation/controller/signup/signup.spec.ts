import { MissingParamError, InvalidParamError, ServerError } from '../../errors'
import { EmailValidator, AddAccount, AddAccountModel, Account, HttpRequest } from './signup-protocols'
import { SignUpController } from './signup'
import { ok, serverError, badRequest } from '../../helpers/http-helper'
import { EmailValidatorAdapter } from '../../../utils/email-validator/email-validator-adapter'

interface MakeTypes {
  singUpController: SignUpController
  emailValidator: EmailValidator
  addAccount: AddAccount
}

const makeEmailValidator = (): EmailValidator => {
  return new EmailValidatorAdapter()
}

const makeAddAccount = (): AddAccount => {
  class AddAccountTest implements AddAccount {
    async add (account: AddAccountModel): Promise<Account> {
      const fakeAccount = {
        id: 'valid_id',
        name: 'valid_name',
        email: 'valid_email',
        password: 'valid_password'
      }

      return await new Promise(resolve => resolve(fakeAccount))
    }
  }

  return new AddAccountTest()
}

const makeSignUpController = (): MakeTypes => {
  const emailValidator = makeEmailValidator()
  const addAccount = makeAddAccount()

  const singUpController = new SignUpController(emailValidator, addAccount)

  return {
    singUpController,
    emailValidator,
    addAccount
  }
}

const makeHttpRequest = (): HttpRequest => ({
  body: {
    name: 'valid_name',
    email: 'valid_email@test.com.br',
    password: 'valid_password',
    passwordConfirmation: 'valid_password'
  }
})

describe('SignUp Controller', () => {
  test('Should return 400 if no name is provided ', async () => {
    const { singUpController } = makeSignUpController()

    const httpRequest = makeHttpRequest()

    delete httpRequest.body.name

    const httpResponse = await singUpController.handle(httpRequest)

    expect(httpResponse).toEqual(badRequest(new MissingParamError('name')))
  })

  test('Should return 400 if no email is provided ', async () => {
    const { singUpController } = makeSignUpController()

    const httpRequest = makeHttpRequest()

    delete httpRequest.body.email

    const httpResponse = await singUpController.handle(httpRequest)

    expect(httpResponse).toEqual(badRequest(new MissingParamError('email')))
  })

  test('Should return 400 if no password is provided ', async () => {
    const { singUpController } = makeSignUpController()

    const httpRequest = makeHttpRequest()

    delete httpRequest.body.password

    const httpResponse = await singUpController.handle(httpRequest)

    expect(httpResponse).toEqual(badRequest(new MissingParamError('password')))
  })

  test('Should return 400 if no passwordConfirmation is provided ', async () => {
    const { singUpController } = makeSignUpController()

    const httpRequest = makeHttpRequest()

    delete httpRequest.body.passwordConfirmation

    const httpResponse = await singUpController.handle(httpRequest)

    expect(httpResponse).toEqual(badRequest(new MissingParamError('passwordConfirmation')))
  })

  test('Should return 400 if invalid email is provided ', async () => {
    const { singUpController, emailValidator } = makeSignUpController()

    const httpRequest = makeHttpRequest()

    httpRequest.body.email = 'any_email_invalid'

    jest.spyOn(emailValidator, 'isValid').mockReturnValueOnce(false)

    const httpResponse = await singUpController.handle(httpRequest)

    expect(httpResponse).toEqual(badRequest(new InvalidParamError('email')))
  })

  test('Should return 400 if password confirmation fails', async () => {
    const { singUpController } = makeSignUpController()

    const httpRequest = makeHttpRequest()

    httpRequest.body.passwordConfirmation = 'password_confirmation_not_equal_to_password'

    const httpResponse = await singUpController.handle(httpRequest)

    expect(httpResponse).toEqual(badRequest(new InvalidParamError('passwordConfirmation')))
  })

  test('Should return 500 if EmailValidator throws', async () => {
    const { singUpController, emailValidator } = makeSignUpController()

    jest.spyOn(emailValidator, 'isValid').mockImplementationOnce(() => { throw new Error() })

    const httpRequest = makeHttpRequest()

    const httpResponse = await singUpController.handle(httpRequest)

    expect(httpResponse).toEqual(serverError(new ServerError()))
  })

  test('Should call EmailValidator with correct email', async () => {
    const { singUpController, emailValidator } = makeSignUpController()

    const httpRequest = makeHttpRequest()

    const isValidSpy = jest.spyOn(emailValidator, 'isValid')

    await singUpController.handle(httpRequest)

    expect(isValidSpy).toHaveBeenCalledWith('valid_email@test.com.br')
  })

  test('Should call CreateUser with correct values', async () => {
    const { singUpController, addAccount } = makeSignUpController()

    const httpRequest = makeHttpRequest()

    const addAccountSpy = jest.spyOn(addAccount, 'add')

    await singUpController.handle(httpRequest)

    expect(addAccountSpy).toHaveBeenCalledWith({
      name: 'valid_name',
      email: 'valid_email@test.com.br',
      password: 'valid_password'
    })
  })

  test('Should return 500 if AddAccount throws', async () => {
    const { singUpController, addAccount } = makeSignUpController()

    jest.spyOn(addAccount, 'add').mockImplementationOnce(async () => {
      return await new Promise((resolve, reject) => reject(new Error()))
    })

    const httpRequest = makeHttpRequest()

    const httpResponse = await singUpController.handle(httpRequest)

    expect(httpResponse).toEqual(serverError(new ServerError()))
  })

  test('Should return 200 if valid data is provided', async () => {
    const { singUpController } = makeSignUpController()

    const httpRequest = makeHttpRequest()

    const httpResponse = await singUpController.handle(httpRequest)

    expect(httpResponse).toEqual(ok({
      id: 'valid_id',
      name: 'valid_name',
      email: 'valid_email'
    }))
  })
})
