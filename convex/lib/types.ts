/**
 * Token data type from validateToken query
 * Used across HTTP router and token routes
 */
export type TokenData = {
  _id: string
  prefix: string
  description: string
  permissions: string[]
}
