
import { ServerError, UnauthorizedError } from '../errors'
import { HttpResponse } from '../protocols'

export const badRequest = ({ message, name }: Error): HttpResponse => {
  return ({
    statusCode: 400,
    body: { name, message }
  })
}

export const serverError = ({ stack }: Error): HttpResponse => {
  const { name, message } = new ServerError(stack)
  return {
    statusCode: 500,
    body: { name, message }
  }
}

export const unauthorized = (): HttpResponse => {
  const { name, message } = new UnauthorizedError()
  return {
    statusCode: 401,
    body: { name, message }
  }
}

export const ok = (body: any): HttpResponse => ({
  statusCode: 200,
  body: body
})
