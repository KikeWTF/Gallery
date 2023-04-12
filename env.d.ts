/// <reference types="vite/client" />

declare module '*.json' {
  const data: { [key: string]: any }
  export default data
}
